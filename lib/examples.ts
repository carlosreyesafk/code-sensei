import type { Language } from './analyzer';

export interface CodeExample {
  id: string;
  name: string;
  language: Language;
  description: string;
  code: string;
}

export const EXAMPLES: CodeExample[] = [
  {
    id: 'js-cart',
    name: 'Shopping cart total',
    language: 'javascript',
    description: 'A cart calculator hiding loose equality, var, and a forgotten await.',
    code: `var discountCodes = ["SAVE10", "WELCOME"];

async function calculateTotal(cart, userCode) {
  var total = 0;
  for (var i = 0; i < cart.length; i++) {
    var item = cart[i];
    if (item.price == null) {
      console.log("skipping item without price");
      continue;
    }
    total += item.price * item.qty;
  }
  if (userCode == "SAVE10") {
    total = total * 0.9;
  }
  const tax = getTaxRate();
  return total + total * tax;
}

function getTaxRate() {
  // TODO: fetch real rate from API
  return 0.08;
}

async function checkout(cart, code) {
  const receipt = calculateTotal(cart, code);
  console.log("charged: " + receipt);
  return receipt;
}`,
  },
  {
    id: 'ts-user',
    name: 'User service (TS)',
    language: 'typescript',
    description: 'TypeScript service with any-types, non-null assertions and deep nesting.',
    code: `interface User {
  id: number;
  name: string;
  email?: string;
}

async function fetchUserData(userId: number): Promise<any> {
  const res = await fetch(\`/api/users/\${userId}\`);
  const data: any = await res.json();
  return data;
}

function sendWelcomeEmail(user: User) {
  const email = user.email!.toLowerCase();
  if (user) {
    if (user.name) {
      if (email) {
        if (email.includes("@")) {
          if (!email.endsWith(".invalid")) {
            console.log(\`Sending email to \${email} for user 12345 with name \${user.name} and id \${user.id}\`);
          }
        }
      }
    }
  }
}

function formatUserBadge(user: any, showDetails: boolean, uppercase: boolean, prefix: string, suffix: string) {
  var label = prefix + user.name + suffix;
  if (uppercase == true) {
    label = label.toUpperCase();
  }
  return showDetails ? label + " <" + user.email + ">" : label;
}`,
  },
  {
    id: 'py-orders',
    name: 'Order processor (Python)',
    language: 'python',
    description: 'Python order pipeline with mutable defaults, bare except and == None.',
    code: `processed_orders = []

def add_order(order, history=[]):
    history.append(order)
    processed_orders.append(order)
    return history

def calculate_discount(price, coupon):
    if coupon == None:
        return 0
    if coupon == "HALF":
        return price * 0.5
    elif coupon == "QUARTER":
        return price * 0.25
    else:
        return 0

def process_batch(orders):
    results = []
    for order in orders:
        try:
            print(f"processing {order['id']}")
            total = order["price"] * order["qty"]
            discount = calculate_discount(total, order.get("coupon"))
            if total > 100:
                if discount > 0:
                    if order.get("priority"):
                        total = total - discount
                        results.append({"id": order["id"], "total": 42})
                    else:
                        results.append({"id": order["id"], "total": total - discount})
                else:
                    results.append({"id": order["id"], "total": total})
            else:
                results.append({"id": order["id"], "total": total})
        except:
            print("something went wrong")
    return results

def get_report():
    # TODO: add CSV export here
    return {"count": len(processed_orders)}`,
  },
];
