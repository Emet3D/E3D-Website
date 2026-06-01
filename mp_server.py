import json, os, urllib.request, urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler

MP_ACCESS_TOKEN = 'APP_USR-6905093304817568-053122-c793a3bc08860923ccb93d50493cc680-1086430425'

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/crear-pago':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length))
                
                items = body.get('items', [])
                if not items:
                    raise Exception('Carrito vacio')
                    
                pref_items = []
                total = 0
                for it in items:
                    pref_items.append({
                        'title': it['name'],
                        'quantity': it['qty'],
                        'unit_price': float(it['price']),
                        'currency_id': 'ARS'
                    })
                    total += it['qty'] * float(it['price'])
                
                preference = {
                    'items': pref_items,
                    'back_urls': {
                        'success': 'https://emet3d.github.io/E3D-Website/',
                        'failure': 'https://emet3d.github.io/E3D-Website/',
                        'pending': 'https://emet3d.github.io/E3D-Website/'
                    },
                    'auto_return': 'approved',
                    'statement_descriptor': 'E3D',
                    'binary_mode': True
                }
                
                data = json.dumps(preference).encode()
                req = urllib.request.Request(
                    'https://api.mercadopago.com/checkout/preferences',
                    data=data,
                    headers={
                        'Authorization': 'Bearer ' + MP_ACCESS_TOKEN,
                        'Content-Type': 'application/json',
                        'X-Idempotency-Key': str(abs(hash(str(items))))
                    }
                )
                
                resp = urllib.request.urlopen(req)
                result = json.loads(resp.read())
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'ok': True,
                    'url': result['init_point'],
                    'total': total
                }).encode())
                
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

port = int(os.environ.get('PORT', 8889))
print('Servidor MP en puerto', port)
HTTPServer(('0.0.0.0', port), Handler).serve_forever()
