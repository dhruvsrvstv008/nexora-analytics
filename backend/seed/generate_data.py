"""
Deterministic seed-data generator for Nexora Analytics.
Seeded with 42 everywhere — fully reproducible.
"""

import random
import math
from calendar import monthrange
from collections import defaultdict
from datetime import date, timedelta

import numpy as np
from faker import Faker

fake = Faker("en_IN")
Faker.seed(42)
random.seed(42)
np.random.seed(42)

# ─── Date range ───────────────────────────────────────────────────────────────
SALES_START = date(2024, 9, 1)
SALES_END   = date(2026, 8, 31)


def _all_months(start: date, end: date) -> list[date]:
    months, cur = [], start.replace(day=1)
    while cur <= end.replace(day=1):
        months.append(cur)
        m = cur.month + 1
        cur = date(cur.year + (m > 12), m if m <= 12 else 1, 1)
    return months


ALL_MONTHS = _all_months(SALES_START, SALES_END)  # 24 months

# ─── Seasonality and growth ───────────────────────────────────────────────────
SEASONALITY = {
    1: 0.88, 2: 0.70, 3: 1.05, 4: 0.92, 5: 0.90, 6: 0.98,
    7: 1.02, 8: 1.08, 9: 1.00, 10: 1.30, 11: 1.40, 12: 1.12,
}


def _growth(month: date) -> float:
    months_elapsed = (month.year - SALES_START.year) * 12 + (month.month - SALES_START.month)
    return 1.05 ** (months_elapsed / 12)


# ─── Department config ────────────────────────────────────────────────────────
# (dept_id, name, cost_center, avg_sal, sal_std, n_mgr, n_active_assoc, n_exits)
DEPT_CONFIG = [
    (1, "Technology",         "CC-TECH", 78000, 15000, 3, 31, 1),
    (2, "Sales",              "CC-SALE", 55000, 10000, 4, 39, 2),
    (3, "Marketing",          "CC-MKTG", 58000, 10000, 2, 16, 1),
    (4, "Operations",         "CC-OPER", 45000,  8000, 2, 26, 1),
    (5, "Finance",            "CC-FINC", 62000, 12000, 1, 15, 1),
    (6, "Human Resources",    "CC-HRMS", 52000,  9000, 1, 12, 1),
    (7, "Customer Support",   "CC-CSUP", 42000,  7000, 1, 18, 9),
    (8, "Product Management", "CC-PROD", 70000, 12000, 1,  9, 1),
]
# Active total: 1 exec + (3+4+2+2+1+1+1+1=15 mgrs) + (31+39+16+26+15+12+18+9=166 assoc active) = 182
# + exits (1+2+1+1+1+1+9+1=17) = 199 total rows ≈ 190 active ✓

TITLES = {
    1: {"executive": "Chief Executive Officer",   "manager": "Engineering Manager",       "senior": "Senior Software Engineer",   "associate": "Software Engineer"},
    2: {"executive": "Chief Revenue Officer",     "manager": "Regional Sales Manager",    "senior": "Senior Sales Executive",     "associate": "Sales Executive"},
    3: {"executive": "Chief Marketing Officer",   "manager": "Marketing Manager",         "senior": "Senior Marketing Analyst",   "associate": "Marketing Analyst"},
    4: {"executive": "Chief Operating Officer",   "manager": "Operations Manager",        "senior": "Senior Operations Analyst",  "associate": "Operations Analyst"},
    5: {"executive": "Chief Financial Officer",   "manager": "Finance Manager",           "senior": "Senior Financial Analyst",   "associate": "Financial Analyst"},
    6: {"executive": "Chief People Officer",      "manager": "HR Manager",                "senior": "Senior HR Business Partner", "associate": "HR Associate"},
    7: {"executive": "VP Customer Success",       "manager": "Support Manager",           "senior": "Senior Support Specialist",  "associate": "Support Specialist"},
    8: {"executive": "Chief Product Officer",     "manager": "Product Manager",           "senior": "Senior Product Analyst",     "associate": "Product Analyst"},
}


def _salary(avg: float, std: float, level: str) -> float:
    mult = {"executive": 3.2, "manager": 1.75, "senior": 1.15, "associate": 0.82}
    raw = np.random.normal(avg * mult[level], std * 0.4)
    return float(max(round(raw / 500) * 500, 18000))


def _rand_date(start: date, end: date) -> date:
    return start + timedelta(days=random.randint(0, (end - start).days))


def _rand_in_month(month: date) -> date:
    _, days = monthrange(month.year, month.month)
    return date(month.year, month.month, random.randint(1, days))


# ─── Category / product config ────────────────────────────────────────────────
CAT_PRODUCT_CONFIG = [
    {
        "name": "Laptops & Computers", "sku_prefix": "LAP",
        "brands": ["Dell", "HP", "Lenovo", "Apple", "Asus", "Acer", "MSI"],
        "lines": ["XPS 15", "EliteBook 840", "ThinkPad X1", "MacBook Pro", "ZenBook Pro",
                  "IdeaPad 5", "Aspire 7", "ProBook 450", "VivoBook 15", "OptiPlex 7090"],
        "specs": ["Core i5 8GB 256GB", "Core i5 16GB 512GB", "Core i7 16GB 512GB",
                  "Core i7 32GB 1TB", "Core i9 32GB 2TB", "Ryzen 5 16GB 512GB",
                  "Ryzen 7 32GB 1TB", "M2 8GB 256GB", "M2 Pro 16GB 512GB", "M3 16GB 512GB"],
        "tiers": [(32000, 52000), (55000, 78000), (80000, 115000)],
        "margin": (0.16, 0.26), "reorder_level": 20, "order_weight": 0.12,
    },
    {
        "name": "Mobile Devices", "sku_prefix": "MOB",
        "brands": ["Samsung", "Apple", "OnePlus", "Google", "Xiaomi", "Vivo", "Realme"],
        "lines": ["Galaxy S24", "Galaxy A54", "iPhone 15 Pro", "iPhone 15",
                  "OnePlus 12", "Pixel 8 Pro", "14 Pro", "X100 Pro", "GT 5 Pro",
                  "iPad Pro 12.9", "Galaxy Tab S9"],
        "specs": ["128GB", "256GB", "512GB", "8GB RAM 128GB", "12GB RAM 256GB",
                  "5G 128GB", "5G 256GB", "WiFi+5G 128GB"],
        "tiers": [(14000, 38000), (40000, 75000), (78000, 145000)],
        "margin": (0.14, 0.22), "reorder_level": 25, "order_weight": 0.12,
    },
    {
        "name": "Networking Equipment", "sku_prefix": "NET",
        "brands": ["Cisco", "Juniper", "Ubiquiti", "Netgear", "HPE Aruba", "TP-Link", "Fortinet"],
        "lines": ["Catalyst 9200", "EX2300", "UniFi Dream Machine", "M4300 Switch",
                  "Instant On AP22", "JetStream S3000", "FortiGate 60F", "PA-220",
                  "Meraki MX68", "T750 Outdoor AP"],
        "specs": ["24-Port", "48-Port", "PoE+", "Layer3 Managed", "WiFi 6", "NGFW 1Gbps",
                  "Dual WAN", "4G LTE Failover", "SD-WAN"],
        "tiers": [(5000, 28000), (30000, 95000), (100000, 200000)],
        "margin": (0.20, 0.32), "reorder_level": 10, "order_weight": 0.08,
    },
    {
        "name": "Audio & Video", "sku_prefix": "AVD",
        "brands": ["Sony", "Jabra", "Bose", "Logitech", "Poly", "Cisco", "Barco", "Epson", "BenQ", "Samsung"],
        "lines": ["WH-1000XM5", "Evolve2 85", "QuietComfort 45", "Brio 4K Webcam",
                  "Studio X30", "Webex Room Kit", "ClickShare CX-30",
                  "EB-2255U Projector", "MW826ST Projector", "75\" Smart Display"],
        "specs": ["ANC Wireless", "4K 30fps", "USB-C", "HDMI 2.1", "8MP Camera",
                  "4K Conference", "Wireless Presentation", "3LCD 5000 ANSI"],
        "tiers": [(3000, 18000), (20000, 60000), (65000, 250000)],
        "margin": (0.18, 0.30), "reorder_level": 15, "order_weight": 0.08,
    },
    {
        "name": "Software Licenses", "sku_prefix": "SWL",
        "brands": ["Microsoft", "Adobe", "Autodesk", "Atlassian", "Salesforce", "SAP", "Zoho", "Tally", "Zoom", "Slack"],
        "lines": ["365 Business Premium", "Creative Cloud Teams", "AutoCAD LT 2024",
                  "Jira + Confluence", "Sales Cloud Enterprise", "Business One",
                  "One Annual", "Prime Gold", "One Business", "Pro Annual"],
        "specs": ["1 User 1yr", "5 Users 1yr", "10 Users 1yr", "25 Users 1yr",
                  "50 Users 1yr", "Enterprise 1yr", "Site License"],
        "tiers": [(2000, 18000), (20000, 55000), (58000, 98000)],
        "margin": (0.35, 0.55), "reorder_level": 30, "order_weight": 0.15,
    },
    {
        "name": "Office Supplies", "sku_prefix": "OFS",
        "brands": ["HP", "Canon", "Epson", "Fellowes", "Leitz", "3M", "Post-it", "Pilot", "Scotch", "Deli"],
        "lines": ["LaserJet Pro", "imageCLASS MF", "EcoTank L", "Powershred 99Ci",
                  "IQ Autofeed", "Magic Tape", "Super Sticky Notes", "G2 Pen Pack",
                  "Copy Paper A4", "Binding Machine"],
        "specs": ["Single Unit", "Box of 10", "Pack of 24", "500 Sheet Ream",
                  "12-Pack", "Case of 5 Reams", "2-Pack", "Office Bundle"],
        "tiers": [(300, 2000), (2200, 8000), (9000, 35000)],
        "margin": (0.40, 0.65), "reorder_level": 50, "order_weight": 0.15,
    },
    {
        "name": "Furniture & Fixtures", "sku_prefix": "FRN",
        "brands": ["Herman Miller", "Steelcase", "Godrej Interio", "Durian", "Wipro Furniture", "Nilkamal", "Humanscale"],
        "lines": ["Aeron Chair", "Leap V2 Chair", "Slimline Desk", "L-Shape Executive Desk",
                  "3-Drawer Pedestal", "Meeting Table 4-Seater", "Conference Table 6-Seater",
                  "Monitor Arm Dual", "Adjustable Laptop Stand", "Steel Almirah"],
        "specs": ["Standard", "Ergonomic", "Height Adjustable", "With Storage",
                  "Premium Leather", "Mesh Back", "Modular"],
        "tiers": [(4000, 18000), (20000, 45000), (48000, 95000)],
        "margin": (0.30, 0.45), "reorder_level": 5, "order_weight": 0.05,
    },
    {
        "name": "Security Systems", "sku_prefix": "SEC",
        "brands": ["Hikvision", "Dahua", "Bosch", "Honeywell", "DSC", "Suprema", "ZKTeco", "Axis", "Paxton", "Genetec"],
        "lines": ["DS-2CD2143G2 Camera", "IPC-HFW2849S Camera", "FLEXIDOME 5100i",
                  "VISTA-20P Alarm", "PowerSeries Pro", "BioLite N2", "K40 Face Recog",
                  "P3245-V Network Cam", "Net2 Access Kit", "Security Center"],
        "specs": ["4MP IR 30m", "8MP IR 50m", "1080p PoE", "4-Zone", "8-Zone",
                  "Fingerprint+Card", "Face+Mask", "IP66 Outdoor", "Annual License"],
        "tiers": [(3000, 18000), (20000, 55000), (58000, 130000)],
        "margin": (0.28, 0.42), "reorder_level": 10, "order_weight": 0.05,
    },
    {
        "name": "Peripherals & Accessories", "sku_prefix": "PER",
        "brands": ["Logitech", "Apple", "Samsung", "WD", "Kingston", "Anker", "Belkin", "APC", "Eaton", "D-Link"],
        "lines": ["MX Master 3S", "Magic Mouse 3", "MX Keys S", "T7 Shield SSD",
                  "My Passport HDD", "DataTraveler USB", "10-Port Hub", "Power Strip",
                  "Back-UPS Pro", "UPS 5PX"],
        "specs": ["Wireless", "USB-C", "2TB", "4TB", "128GB USB3.2",
                  "1500VA", "3000VA", "5-Port Gigabit", "7-in-1"],
        "tiers": [(500, 5000), (5500, 18000), (20000, 50000)],
        "margin": (0.32, 0.50), "reorder_level": 40, "order_weight": 0.15,
    },
    {
        "name": "Cloud & Managed Services", "sku_prefix": "CLD",
        "brands": ["AWS", "Microsoft Azure", "Google Cloud", "Cloudflare", "Akamai", "CrowdStrike", "Datadog", "Elastic", "MongoDB", "Twilio"],
        "lines": ["EC2 Reserved Instance", "VM B4ms Reserved", "Compute Engine",
                  "Business Plan", "Content Delivery", "Falcon Pro",
                  "Pro Annual", "Gold Annual", "Atlas M10", "Flex Named Users"],
        "specs": ["1yr Subscription", "2yr Subscription", "Monthly Rolling",
                  "Per Seat Annual", "Enterprise Annual", "Startup Plan"],
        "tiers": [(10000, 35000), (38000, 72000), (75000, 125000)],
        "margin": (0.38, 0.55), "reorder_level": 20, "order_weight": 0.05,
    },
]

# Products per category
PRODUCTS_PER_CAT = 45
# Special inventory pattern product IDs (1-based, set after products generated)
# Will be computed in gen_inventory_and_movements
OUT_OF_STOCK_COUNT  = 8
LOW_STOCK_COUNT     = 17
OVERSTOCK_COUNT     = 4
STOCKOUT_RISK_COUNT = 4


# ─── Regions ─────────────────────────────────────────────────────────────────
REGIONS = [
    (1, "Delhi NCR",           "North"),
    (2, "Punjab & Haryana",    "North"),
    (3, "Tamil Nadu & Kerala", "South"),
    (4, "Andhra & Telangana",  "South"),
    (5, "West Bengal",         "East"),
    (6, "Odisha & Jharkhand",  "East"),
    (7, "Maharashtra",         "West"),
    (8, "Gujarat",             "West"),
]

# ─── Payment methods ─────────────────────────────────────────────────────────
PAYMENT_METHODS = ["UPI", "NEFT", "RTGS", "Credit Card", "Cheque", "Bank Transfer"]
PAYMENT_WEIGHTS  = [0.25,  0.25,  0.15,   0.15,          0.10,     0.10]

# ─── Sales employee performance multipliers ───────────────────────────────────
# Injected onto managers in Sales dept (dept_id=2):
#   manager index 0,1 → overachievers (1.15x)
#   manager index 2   → underperformer (0.85x)
#   manager index 3   → normal (1.00x)
MGRS_PERF_MULT = [1.15, 1.12, 0.85, 1.00]


# ══════════════════════════════════════════════════════════════════════════════
# Generator functions
# ══════════════════════════════════════════════════════════════════════════════

def gen_departments() -> list[dict]:
    return [
        {"department_id": d[0], "name": d[1], "cost_center_code": d[2]}
        for d in DEPT_CONFIG
    ]


def gen_regions() -> list[dict]:
    return [{"region_id": r[0], "name": r[1], "zone": r[2]} for r in REGIONS]


def gen_categories() -> list[dict]:
    return [
        {"category_id": i + 1, "name": cfg["name"], "parent_category_id": None}
        for i, cfg in enumerate(CAT_PRODUCT_CONFIG)
    ]


def gen_products() -> list[dict]:
    products = []
    pid = 1
    for cat_idx, cfg in enumerate(CAT_PRODUCT_CONFIG):
        cat_id = cat_idx + 1
        brands = cfg["brands"]
        lines  = cfg["lines"]
        specs  = cfg["specs"]
        tiers  = cfg["tiers"]
        lo_m, hi_m = cfg["margin"]

        for i in range(PRODUCTS_PER_CAT):
            tier_idx = i // (PRODUCTS_PER_CAT // len(tiers))
            tier_idx = min(tier_idx, len(tiers) - 1)
            min_cost, max_cost = tiers[tier_idx]

            unit_cost = round(random.uniform(min_cost, max_cost) / 100) * 100
            margin    = random.uniform(lo_m, hi_m)
            unit_price = round(unit_cost * (1 + margin) / 100) * 100

            brand  = brands[i % len(brands)]
            line   = lines[i % len(lines)]
            spec   = specs[i % len(specs)]
            model  = f"{random.choice('ABCDEFGHKLMNPQRSTVWX')}{random.randint(10,99)}-{random.randint(1000,9999)}"

            products.append({
                "product_id":    pid,
                "sku":           f"{cfg['sku_prefix']}-{pid:05d}",
                "name":          f"{brand} {line} {model} {spec}",
                "category_id":   cat_id,
                "unit_cost":     float(unit_cost),
                "unit_price":    float(unit_price),
                "reorder_level": cfg["reorder_level"],
                "is_active":     True,
            })
            pid += 1

    return products


def gen_employees() -> tuple[list[dict], dict[int, list[int]]]:
    """
    Returns (employees_list, dept_to_manager_ids_map).
    Employees have explicit employee_id for FK linking.
    """
    employees: list[dict] = []
    used_emails: set[str] = set()
    eid = 1

    def _email(name: str) -> str:
        slug = name.lower().replace(" ", ".").replace("'", "").replace("-", "")
        base = f"{slug}@nexora.in"
        if base in used_emails:
            base = f"{slug}{random.randint(2, 99)}@nexora.in"
        used_emails.add(base)
        return base

    def _emp(dept_id, level, avg_sal, sal_std, hire_d, mgr_id=None, status="active", exit_d=None) -> int:
        nonlocal eid
        name = fake.name()
        employees.append({
            "employee_id": eid,
            "full_name":   name,
            "email":       _email(name),
            "department_id": dept_id,
            "manager_id":  mgr_id,
            "job_title":   TITLES[dept_id][level],
            "job_level":   level,
            "salary":      _salary(avg_sal, sal_std, level),
            "hire_date":   hire_d,
            "exit_date":   exit_d,
            "status":      status,
        })
        old = eid
        eid += 1
        return old

    # ── Executive (employee_id = 1) ──────────────────────────────────────────
    EXEC_ID = eid
    employees.append({
        "employee_id": eid, "full_name": "Arjun Mehta",
        "email": "arjun.mehta@nexora.in",
        "department_id": 8, "manager_id": None,
        "job_title": "Chief Executive Officer", "job_level": "executive",
        "salary": float(round(np.random.normal(78000 * 3.2, 15000 * 0.3) / 500) * 500),
        "hire_date": date(2022, 1, 15), "exit_date": None, "status": "active",
    })
    used_emails.add("arjun.mehta@nexora.in")
    eid += 1

    # ── Managers ─────────────────────────────────────────────────────────────
    mgr_hire_pool = [
        date(2022, 4, 1), date(2022, 7, 1), date(2022, 10, 1),
        date(2023, 2, 1), date(2023, 4, 1), date(2023, 7, 1),
        date(2023, 9, 1), date(2023, 11, 1), date(2024, 1, 1),
        date(2024, 3, 1), date(2024, 5, 1), date(2024, 6, 1),
        date(2024, 7, 1), date(2024, 8, 1), date(2024, 9, 1),
        date(2024, 10, 1), date(2024, 11, 1),
    ]

    dept_mgr_ids: dict[int, list[int]] = {}

    for dept_id, _, _, avg_sal, sal_std, n_mgr, _, _ in DEPT_CONFIG:
        mgr_ids = []
        for _ in range(n_mgr):
            hire_d = mgr_hire_pool.pop(0) if mgr_hire_pool else date(2024, 1, 1)
            mid = _emp(dept_id, "manager", avg_sal, sal_std, hire_d, mgr_id=EXEC_ID)
            mgr_ids.append(mid)
        dept_mgr_ids[dept_id] = mgr_ids

    # ── Associates / Seniors ─────────────────────────────────────────────────
    # Hire date buckets drive headcount growth: ~60% by end-2024, ~80% by end-2025
    for dept_id, _, _, avg_sal, sal_std, _, n_active, n_exits in DEPT_CONFIG:
        mgr_ids = dept_mgr_ids[dept_id]
        total   = n_active + n_exits

        for i in range(total):
            frac = i / max(total - 1, 1)
            if frac < 0.60:
                hire_d = _rand_date(date(2023, 6, 1), date(2024, 12, 31))
            elif frac < 0.80:
                hire_d = _rand_date(date(2025, 1, 1), date(2025, 12, 31))
            else:
                hire_d = _rand_date(date(2026, 1, 1), date(2026, 8, 15))

            level = "senior" if random.random() < 0.28 else "associate"

            if i >= n_active:
                # Exited employee (attrition — heavy in Customer Support)
                earliest_exit = hire_d + timedelta(days=120)
                latest_exit   = min(hire_d + timedelta(days=700), date(2026, 7, 31))
                if latest_exit <= earliest_exit:
                    latest_exit = earliest_exit + timedelta(days=60)
                exit_d = _rand_date(earliest_exit, latest_exit)
                status = "resigned" if random.random() < 0.72 else "terminated"
                _emp(dept_id, level, avg_sal, sal_std, hire_d,
                     mgr_id=random.choice(mgr_ids), status=status, exit_d=exit_d)
            else:
                _emp(dept_id, level, avg_sal, sal_std, hire_d, mgr_id=random.choice(mgr_ids))

    return employees, dept_mgr_ids


def gen_users(employees: list[dict]) -> list[dict]:
    import bcrypt as _bcrypt

    def _hash(pw: str) -> str:
        return _bcrypt.hashpw(pw.encode(), _bcrypt.gensalt(rounds=10)).decode()

    # 4 fixed demo users (no employee link for admin/analyst)
    demo = [
        {"email": "admin@nexora.dev",    "password": "Admin@123",    "role": "admin",    "emp_id": None},
        {"email": "analyst@nexora.dev",  "password": "Analyst@123",  "role": "analyst",  "emp_id": None},
        {"email": "manager@nexora.dev",  "password": "Manager@123",  "role": "manager",  "emp_id": None},
        {"email": "employee@nexora.dev", "password": "Employee@123", "role": "employee", "emp_id": None},
    ]

    # Link demo manager to first Sales manager, demo employee to first Sales associate
    sales_mgrs = [e for e in employees if e["department_id"] == 2 and e["job_level"] == "manager"]
    sales_emps = [e for e in employees if e["department_id"] == 2 and e["job_level"] == "associate"]
    if sales_mgrs:
        demo[2]["emp_id"] = sales_mgrs[0]["employee_id"]
    if sales_emps:
        demo[3]["emp_id"] = sales_emps[0]["employee_id"]

    users = []
    uid = 1
    for d in demo:
        users.append({
            "user_id": uid, "employee_id": d["emp_id"],
            "email": d["email"], "password_hash": _hash(d["password"]),
            "role": d["role"], "is_active": True,
        })
        uid += 1

    return users


def gen_sales_and_items(
    employees: list[dict],
    products:  list[dict],
    dept_mgr_ids: dict[int, list[int]],
) -> tuple[list[dict], list[dict]]:

    # Only Sales dept (dept_id=2) employees make sales
    sales_emps = [
        e for e in employees
        if e["department_id"] == 2 and e["status"] == "active"
    ]

    # Performance multiplier per Sales manager (and propagated to their reports)
    sales_mgr_ids = dept_mgr_ids[2]  # list of manager employee_ids for Sales dept
    mgr_perf: dict[int, float] = {
        mid: MGRS_PERF_MULT[i] for i, mid in enumerate(sales_mgr_ids)
    }

    def _perf(emp: dict) -> float:
        if emp["job_level"] == "manager":
            return mgr_perf.get(emp["employee_id"], 1.0)
        # Associates inherit their manager's multiplier with some noise
        base = mgr_perf.get(emp["manager_id"], 1.0)
        return max(0.5, base + np.random.normal(0, 0.08))

    emp_perf = {e["employee_id"]: _perf(e) for e in sales_emps}

    # Product selection weights based on category order_weight + special products
    # First 8 products of cat 6 (Office Supplies, IDs 226-233) → out of stock — reduce weight
    # Products 271-274 (Furniture) → overstock pattern — reduce weight
    # Products 46-49 (Mobile) → stockout-risk — boost weight
    def _prod_weight(p: dict) -> float:
        cat_cfg = CAT_PRODUCT_CONFIG[p["category_id"] - 1]
        base = cat_cfg["order_weight"]
        pid = p["product_id"]
        if 226 <= pid <= 233:  # out-of-stock
            return base * 0.05
        if 271 <= pid <= 274:  # overstock
            return base * 0.05
        if 46 <= pid <= 49:    # stockout-risk (high velocity)
            return base * 4.0
        return base

    prod_ids    = [p["product_id"] for p in products]
    prod_lookup = {p["product_id"]: p for p in products}
    raw_weights = [_prod_weight(p) for p in products]
    total_w     = sum(raw_weights)
    prod_probs  = [w / total_w for w in raw_weights]

    region_ids = [r[0] for r in REGIONS]

    sales: list[dict]      = []
    sale_items: list[dict] = []
    order_num  = 1
    item_id    = 1

    # Order statuses: 78% completed, 10% pending, 7% cancelled, 5% returned
    ORDER_STATUSES  = ["completed", "pending", "cancelled", "returned"]
    ORDER_STATUS_W  = [0.78, 0.10, 0.07, 0.05]

    for month in ALL_MONTHS:
        season = SEASONALITY[month.month]
        growth = _growth(month)

        for emp in sales_emps:
            # Check if this employee was active during this month
            hire_m = emp["hire_date"].replace(day=1)
            if hire_m > month:
                continue
            exit_d = emp.get("exit_date")
            if exit_d and exit_d.replace(day=1) <= month:
                continue

            perf     = emp_perf[emp["employee_id"]]
            lam      = max(1, 17 * season * growth * perf)
            n_orders = np.random.poisson(lam)

            for _ in range(n_orders):
                order_date = _rand_in_month(month)
                region_id  = random.choice(region_ids)
                status     = random.choices(ORDER_STATUSES, ORDER_STATUS_W)[0]
                payment    = random.choices(PAYMENT_METHODS, PAYMENT_WEIGHTS)[0]
                customer   = fake.company()

                # Choose 1-5 distinct products for this order
                n_items = min(np.random.poisson(2) + 1, 5)
                chosen  = np.random.choice(len(prod_ids), size=min(n_items, len(prod_ids)), replace=False, p=prod_probs)
                chosen_products = [products[i] for i in chosen]

                order_items = []
                for prod in chosen_products:
                    qty        = random.randint(1, 8)
                    unit_price = float(prod["unit_price"]) * random.uniform(0.97, 1.03)
                    unit_price = round(unit_price / 10) * 10
                    unit_cost  = float(prod["unit_cost"])
                    line_total = round(unit_price * qty, 2)

                    order_items.append({
                        "sale_item_id": item_id,
                        "product_id":   prod["product_id"],
                        "quantity":     qty,
                        "unit_price":   round(unit_price, 2),
                        "unit_cost":    unit_cost,
                        "line_total":   line_total,
                    })
                    item_id += 1

                subtotal     = round(sum(i["line_total"] for i in order_items), 2)
                disc_pct     = random.choices([0, 0.03, 0.05, 0.08, 0.10],
                                              weights=[0.40, 0.25, 0.20, 0.10, 0.05])[0]
                discount     = round(subtotal * disc_pct, 2)
                total_amount = round(subtotal - discount, 2)

                sale_id = order_num
                sales.append({
                    "sale_id":      sale_id,
                    "order_number": f"ORD-{order_date.year}-{order_num:06d}",
                    "employee_id":  emp["employee_id"],
                    "region_id":    region_id,
                    "customer_name": customer,
                    "order_date":   order_date,
                    "status":       status,
                    "payment_method": payment,
                    "subtotal":     subtotal,
                    "discount":     discount,
                    "total_amount": total_amount,
                })

                for it in order_items:
                    it["sale_id"] = sale_id
                    sale_items.append(it)

                order_num += 1

    return sales, sale_items


def gen_inventory_and_movements(
    products: list[dict],
    sale_items: list[dict],
) -> tuple[list[dict], list[dict]]:

    # Total outbound per product (from completed sales — approximate; all sales for simplicity)
    sold_qty: dict[int, int] = defaultdict(int)
    for si in sale_items:
        sold_qty[si["product_id"]] += si["quantity"]

    # Define special product ID sets
    # Out of stock: first 8 products across cats 6 (Office Supplies) and 9 (Peripherals)
    OUT_OF_STOCK  = set(range(226, 234))          # 8 products
    LOW_STOCK     = set(range(234, 251))           # 17 products
    OVERSTOCK     = {271, 272, 316, 317}           # Furniture + Security (slow-moving)
    STOCKOUT_RISK = {46, 47, 48, 49}               # Popular mobiles (high velocity)

    inventory:  list[dict] = []
    movements:  list[dict] = []
    inv_id  = 1
    mov_id  = 1
    wh_zones = ["A-01", "A-02", "B-01", "B-02", "C-01", "C-02", "D-01"]

    for p in products:
        pid  = p["product_id"]
        rl   = p["reorder_level"]
        sold = sold_qty.get(pid, 0)

        if pid in OUT_OF_STOCK:
            qty_on_hand = 0
            initial_stock = max(sold, rl)          # was in stock, now depleted
            total_inbound = 0
        elif pid in OVERSTOCK:
            qty_on_hand = rl * random.randint(15, 22)
            initial_stock = rl * 3
            total_inbound = qty_on_hand + sold - initial_stock
        elif pid in STOCKOUT_RISK:
            qty_on_hand = random.randint(3, 9)
            initial_stock = rl * 4
            total_inbound = max(0, qty_on_hand + sold - initial_stock)
        elif pid in LOW_STOCK:
            qty_on_hand = random.randint(1, max(1, rl - 1))
            initial_stock = rl * 2
            total_inbound = max(0, qty_on_hand + sold - initial_stock)
        else:
            qty_on_hand = rl * random.randint(3, 9)
            initial_stock = rl * 4
            total_inbound = max(0, qty_on_hand + sold - initial_stock)

        # Inventory record
        last_restock = None
        if total_inbound > 0 or pid not in OUT_OF_STOCK:
            last_restock = _rand_date(date(2024, 6, 1), date(2026, 8, 1))

        inventory.append({
            "inventory_id":     inv_id,
            "product_id":       pid,
            "quantity_on_hand": qty_on_hand,
            "warehouse_location": random.choice(wh_zones),
            "last_restocked_at": last_restock,
        })
        inv_id += 1

        # Stock movements: 1 initial inbound
        movements.append({
            "movement_id":   mov_id,
            "product_id":    pid,
            "movement_type": "inbound",
            "quantity":      initial_stock,
            "movement_date": _rand_date(date(2024, 7, 1), date(2024, 8, 31)),
            "reference_id":  f"PO-INIT-{pid:05d}",
        })
        mov_id += 1

        # Restock events (spread across the 24 months)
        if total_inbound > 0:
            n_restocks = random.randint(2, 5)
            restock_dates = sorted([
                _rand_date(date(2024, 9, 1), date(2026, 8, 31))
                for _ in range(n_restocks)
            ])
            per_restock = max(1, total_inbound // n_restocks)
            remaining   = total_inbound
            for i, rd in enumerate(restock_dates):
                qty = per_restock if i < n_restocks - 1 else remaining
                if qty <= 0:
                    break
                movements.append({
                    "movement_id":   mov_id,
                    "product_id":    pid,
                    "movement_type": "inbound",
                    "quantity":      qty,
                    "movement_date": rd,
                    "reference_id":  f"PO-{pid:05d}-{i+1:03d}",
                })
                mov_id  += 1
                remaining -= qty

        # Outbound movements: aggregate sold quantity spread across months
        if sold > 0:
            n_out = min(sold, random.randint(4, 12))
            per_out = sold // n_out
            for j in range(n_out):
                movements.append({
                    "movement_id":   mov_id,
                    "product_id":    pid,
                    "movement_type": "outbound",
                    "quantity":      per_out,
                    "movement_date": _rand_date(date(2024, 9, 1), date(2026, 8, 31)),
                    "reference_id":  f"SO-{pid:05d}-{j+1:03d}",
                })
                mov_id += 1

    return inventory, movements


def gen_targets(
    employees: list[dict],
    dept_mgr_ids: dict[int, list[int]],
    sales: list[dict],
) -> list[dict]:
    """Monthly targets for every Sales employee + department targets for all depts."""
    targets = []
    tid     = 1

    # Calculate each Sales employee's avg monthly revenue from completed sales
    emp_monthly: dict[int, dict[date, float]] = defaultdict(lambda: defaultdict(float))
    for s in sales:
        if s["status"] == "completed":
            m = s["order_date"].replace(day=1)
            emp_monthly[s["employee_id"]][m] += float(s["total_amount"])

    sales_emps = [
        e for e in employees
        if e["department_id"] == 2 and e["status"] == "active"
    ]
    sales_mgr_ids = dept_mgr_ids[2]
    mgr_perf_map  = {mid: MGRS_PERF_MULT[i] for i, mid in enumerate(sales_mgr_ids)}

    for emp in sales_emps:
        monthly_revs = emp_monthly.get(emp["employee_id"], {})
        if not monthly_revs:
            avg_rev = 500000
        else:
            avg_rev = sum(monthly_revs.values()) / len(monthly_revs)

        perf = mgr_perf_map.get(emp["employee_id"], mgr_perf_map.get(emp.get("manager_id"), 1.0))

        for month in ALL_MONTHS:
            hire_m = emp["hire_date"].replace(day=1)
            if hire_m > month:
                continue
            # Target is set so employee achieves their performance multiple against it
            target_base = avg_rev / max(perf, 0.1) * SEASONALITY[month.month] * _growth(month)
            target_amt  = round(target_base * random.uniform(0.92, 1.08), -3)
            targets.append({
                "target_id":     tid,
                "employee_id":   emp["employee_id"],
                "department_id": None,
                "period_month":  month,
                "target_amount": max(float(target_amt), 50000),
            })
            tid += 1

    # Department-level targets for all 8 departments
    dept_monthly_rev: dict[int, dict[date, float]] = defaultdict(lambda: defaultdict(float))
    emp_dept = {e["employee_id"]: e["department_id"] for e in employees}
    for s in sales:
        if s["status"] == "completed":
            dept_id = emp_dept.get(s["employee_id"])
            if dept_id:
                m = s["order_date"].replace(day=1)
                dept_monthly_rev[dept_id][m] += float(s["total_amount"])

    for dept_id, *_ in DEPT_CONFIG:
        monthly_revs = dept_monthly_rev.get(dept_id, {})
        avg_rev = sum(monthly_revs.values()) / max(len(monthly_revs), 1) if monthly_revs else 5_000_000
        for month in ALL_MONTHS:
            target_amt = round(avg_rev * SEASONALITY[month.month] * _growth(month) * random.uniform(0.95, 1.05), -3)
            targets.append({
                "target_id":     tid,
                "employee_id":   None,
                "department_id": dept_id,
                "period_month":  month,
                "target_amount": max(float(target_amt), 100000),
            })
            tid += 1

    return targets


def gen_expenses(
    departments: list[dict],
    sales: list[dict],
) -> list[dict]:
    expenses = []
    exp_id = 1

    # Monthly revenue for payroll-as-%-of-revenue calculation
    monthly_rev: dict[date, float] = defaultdict(float)
    for s in sales:
        if s["status"] == "completed":
            monthly_rev[s["order_date"].replace(day=1)] += float(s["total_amount"])

    # Expense categories per department (proportional weights)
    dept_expense_cfg = {
        # dept_id: {category: (base_amt, std_dev)}
        1: {"payroll": (2800000, 200000), "infrastructure": (400000, 80000), "misc": (60000, 20000)},
        2: {"payroll": (2400000, 180000), "operations": (500000, 100000), "marketing": (300000, 80000), "misc": (80000, 25000)},
        3: {"payroll": (1200000, 100000), "marketing": (800000, 150000), "misc": (100000, 30000)},
        4: {"payroll": (1400000, 120000), "operations": (700000, 120000), "misc": (80000, 20000)},
        5: {"payroll": (1000000, 90000), "operations": (150000, 40000), "misc": (50000, 15000)},
        6: {"payroll": (800000, 80000), "operations": (120000, 30000), "misc": (40000, 12000)},
        7: {"payroll": (850000, 80000), "operations": (200000, 50000), "misc": (50000, 15000)},
        8: {"payroll": (900000, 90000), "infrastructure": (200000, 50000), "misc": (60000, 20000)},
    }

    for dept in departments:
        dept_id = dept["department_id"]
        cfg = dept_expense_cfg.get(dept_id, {"payroll": (500000, 50000), "misc": (30000, 10000)})

        for month in ALL_MONTHS:
            growth = _growth(month)
            for cat, (base, std) in cfg.items():
                amt = max(10000, np.random.normal(base * growth, std))
                expenses.append({
                    "expense_id":       exp_id,
                    "department_id":    dept_id,
                    "expense_category": cat,
                    "amount":           round(float(amt), 2),
                    "expense_date":     _rand_in_month(month),
                    "description":      f"{cat.title()} — {month.strftime('%b %Y')}",
                })
                exp_id += 1

    return expenses


# ══════════════════════════════════════════════════════════════════════════════
def generate_all() -> dict:
    print("Generating departments and regions...")
    departments = gen_departments()
    regions     = gen_regions()
    categories  = gen_categories()

    print("Generating products (450)...")
    products = gen_products()

    print("Generating employees (~195)...")
    employees, dept_mgr_ids = gen_employees()

    print("Generating users...")
    users = gen_users(employees)

    print("Generating sales and sale_items (~15k orders, ~40k items)...")
    sales, sale_items = gen_sales_and_items(employees, products, dept_mgr_ids)

    print("Generating inventory and stock movements...")
    inventory, stock_movements = gen_inventory_and_movements(products, sale_items)

    print("Generating targets...")
    targets = gen_targets(employees, dept_mgr_ids, sales)

    print("Generating expenses...")
    expenses = gen_expenses(departments, sales)

    return {
        "departments":    departments,
        "regions":        regions,
        "categories":     categories,
        "products":       products,
        "employees":      employees,
        "users":          users,
        "sales":          sales,
        "sale_items":     sale_items,
        "inventory":      inventory,
        "stock_movements": stock_movements,
        "targets":        targets,
        "expenses":       expenses,
    }
