from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from . import models, schemas, auth


def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).offset(skip).limit(limit).all()


def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def get_product_by_barcode(db: Session, barcode: str):
    return db.query(models.Product).filter(models.Product.barcode == barcode).first()


def create_inventory(db: Session, inventory: schemas.InventoryCreate):
    db_inventory = models.Inventory(**inventory.model_dump())
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


# YANGI: Ombor qoldiqlarini tortib kelish
def get_inventory_list(db: Session):
    return db.query(models.Inventory).filter(models.Inventory.quantity > 0).order_by(models.Inventory.id.desc()).all()


def create_sale(db: Session, sale_data: schemas.SaleCreate):
    db_sale = models.Sale(
        payment_type=sale_data.payment_type,
        total_amount=0,
        is_credit=sale_data.is_credit,
        customer_name=sale_data.customer_name
    )
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)

    total_amount = 0.0

    for item in sale_data.items:
        inventory = db.query(models.Inventory).filter(models.Inventory.product_id == item.product_id).order_by(
            models.Inventory.id.desc()).first()

        if inventory:
            price = inventory.selling_price
            cost_price = inventory.cost_price
            inventory.quantity -= item.quantity
        else:
            price = 0.0
            cost_price = 0.0

        line_total = price * item.quantity
        total_amount += line_total

        db_sale_item = models.SaleItem(
            sale_id=db_sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price=price,
            cost_price=cost_price
        )
        db.add(db_sale_item)

    db_sale.total_amount = total_amount
    db.commit()
    db.refresh(db_sale)
    return db_sale


def pay_customer_debt(db: Session, payment: schemas.DebtPaymentCreate):
    db_pay = models.CustomerPayment(customer_name=payment.name, amount=payment.amount)
    db.add(db_pay)
    db.commit()
    return db_pay


def pay_supplier_debt(db: Session, payment: schemas.DebtPaymentCreate):
    db_pay = models.SupplierPayment(supplier_name=payment.name, amount=payment.amount)
    db.add(db_pay)
    db.commit()
    return db_pay


def get_dashboard_stats(db: Session, start_date: str = None, end_date: str = None):
    sales_query = db.query(models.Sale)
    inv_query = db.query(models.Inventory)
    cust_pay_query = db.query(models.CustomerPayment)
    supp_pay_query = db.query(models.SupplierPayment)

    if start_date:
        start_dt = datetime.strptime(f"{start_date} 00:00:00", "%Y-%m-%d %H:%M:%S")
        sales_query = sales_query.filter(models.Sale.created_at >= start_dt)
        inv_query = inv_query.filter(models.Inventory.created_at >= start_dt)
        cust_pay_query = cust_pay_query.filter(models.CustomerPayment.created_at >= start_dt)
        supp_pay_query = supp_pay_query.filter(models.SupplierPayment.created_at >= start_dt)

    if end_date:
        end_dt = datetime.strptime(f"{end_date} 23:59:59", "%Y-%m-%d %H:%M:%S")
        sales_query = sales_query.filter(models.Sale.created_at <= end_dt)
        inv_query = inv_query.filter(models.Inventory.created_at <= end_dt)
        cust_pay_query = cust_pay_query.filter(models.CustomerPayment.created_at <= end_dt)
        supp_pay_query = supp_pay_query.filter(models.SupplierPayment.created_at <= end_dt)

    sales = sales_query.all()
    total_revenue = sum(sale.total_amount for sale in sales)

    sale_ids = [s.id for s in sales]
    if sale_ids:
        sale_items = db.query(models.SaleItem).filter(models.SaleItem.sale_id.in_(sale_ids)).all()
    else:
        sale_items = []

    total_cogs = sum(item.cost_price * item.quantity for item in sale_items)
    net_profit = total_revenue - total_cogs

    credit_sales = [s for s in sales if s.is_credit]
    customer_payments = cust_pay_query.all()

    customer_balances = {}
    for sale in credit_sales:
        name = sale.customer_name or "Noma'lum"
        customer_balances[name] = customer_balances.get(name, 0) + sale.total_amount

    for pay in customer_payments:
        name = pay.customer_name
        if name in customer_balances:
            customer_balances[name] -= pay.amount
        else:
            customer_balances[name] = -pay.amount

    customer_debts = [{"name": k, "balance": v} for k, v in customer_balances.items() if v != 0]
    total_customer_debt = sum(d["balance"] for d in customer_debts)

    inventories = inv_query.all()
    credit_invs = [i for i in inventories if i.is_credit]
    supplier_payments = supp_pay_query.all()

    supplier_balances = {}
    for inv in credit_invs:
        name = inv.supplier_name or "Noma'lum"
        supplier_balances[name] = supplier_balances.get(name, 0) + (inv.quantity * inv.cost_price)

    for pay in supplier_payments:
        name = pay.supplier_name
        if name in supplier_balances:
            supplier_balances[name] -= pay.amount
        else:
            supplier_balances[name] = -pay.amount

    supplier_debts = [{"name": k, "balance": v} for k, v in supplier_balances.items() if v != 0]
    total_supplier_debt = sum(d["balance"] for d in supplier_debts)

    low_stock_query = db.query(models.Inventory).filter(models.Inventory.quantity <= 10).all()
    low_stock_items = [
        {"product_name": item.product.name, "quantity": item.quantity, "selling_price": item.selling_price}
        for item in low_stock_query
    ]

    return {
        "pl_analysis": {"revenue": total_revenue, "cogs": total_cogs, "net_profit": net_profit},
        "debts_receive": {"total": total_customer_debt, "list": customer_debts},
        "debts_pay": {"total": total_supplier_debt, "list": supplier_debts},
        "low_stock_items": low_stock_items
    }


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user