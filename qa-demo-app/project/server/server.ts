import express from 'express'; import swaggerUi from 'swagger-ui-express'; import { WebSocketServer } from 'ws'; import { createServer } from 'http'; import fs from 'fs';
const app = express(); app.use(express.json());
const users = [{ email: 'qa.tester@nivi.dev', password: 'Test@1234', name: 'Nivi Tester', role: 'user' },
  { email: 'admin@nivi.dev', password: 'Admin@1234', name: 'Admin', role: 'admin' }];
const tokens = new Map<string, any>();
const cats = ['Electronics', 'Accessories', 'Displays'];
const products = Array.from({ length: 24 }, (_, i) => ({ id: i + 1, name: ['Laptop', 'Phone', 'Headset', 'Keyboard', 'Mouse', 'Monitor'][i % 6] + ' ' + (i + 1), category: cats[i % 3], price: 20 + i * 13, description: `Product ${i + 1} description` }));
let items: any[] = [{ id: 1, name: 'Sample', qty: 1 }], nextId = 2;
const bearer = (req: any) => (req.headers.authorization || '').replace('Bearer ', '');
const auth = (role?: string) => (req: any, res: any, next: any) => {
  const u = tokens.get(bearer(req));
  if (!u) return res.status(401).json({ error: 'Unauthorized' });
  if (role && u.role !== role) return res.status(403).json({ error: 'Forbidden' });
  req.user = u; next();
};
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const u = users.find(x => x.email === email && x.password === password);
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });
  const token = 'tok_' + Math.random().toString(36).slice(2); tokens.set(token, u);
  res.json({ token, user: { email: u.email, name: u.name, role: u.role } });
});
app.post('/api/logout', auth(), (req, res) => { tokens.delete(bearer(req)); res.json({ ok: true }); });
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || (password || '').length < 8) return res.status(400).json({ error: 'Invalid input' });
  if (users.some(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  users.push({ name, email, password, role: 'user' }); res.status(201).json({ ok: true });
});
app.get('/api/me', auth(), (req: any, res) => res.json({ email: req.user.email, name: req.user.name, role: req.user.role }));
app.get('/api/admin', auth('admin'), (_req, res) => res.json({ secret: 'admin-data' }));
app.get('/api/products', (req, res) => {
  const { q = '', category = '', sort = '', page = '1', size = '6' } = req.query as any;
  const list = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) && (!category || p.category === category));
  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ total: list.length, page: +page, items: list.slice((+page - 1) * +size, +page * +size) });
});
app.get('/api/products/:id', (req, res) => { const p = products.find(x => x.id === +req.params.id); p ? res.json(p) : res.status(404).json({ error: 'Not found' }); });
app.get('/api/items', (_q, res) => res.json(items));
app.post('/api/items', (req, res) => { if (!req.body?.name) return res.status(400).json({ error: 'name required' }); const i = { id: nextId++, qty: 1, ...req.body }; items.push(i); res.status(201).json(i); });
app.put('/api/items/:id', (req, res) => { const i = items.findIndex(x => x.id === +req.params.id); if (i < 0) return res.status(404).json({ error: 'Not found' }); items[i] = { id: +req.params.id, ...req.body }; res.json(items[i]); });
app.patch('/api/items/:id', (req, res) => { const i = items.find(x => x.id === +req.params.id); if (!i) return res.status(404).json({ error: 'Not found' }); Object.assign(i, req.body); res.json(i); });
app.delete('/api/items/:id', (req, res) => { const n = items.length; items = items.filter(x => x.id !== +req.params.id); n === items.length ? res.status(404).json({ error: 'Not found' }) : res.status(204).end(); });
app.get('/api/status/:code', (req, res) => { const c = +req.params.code; res.status(c >= 200 && c < 600 ? c : 400).json({ status: c, message: `Responded with ${c}` }); });
app.get('/api/slow', (req, res) => { const ms = Math.min(+(req.query.ms || 3000), 10000); setTimeout(() => res.json({ delayed: ms }), ms); });
app.post('/api/reset', (_q, res) => { items = [{ id: 1, name: 'Sample', qty: 1 }]; nextId = 2; res.json({ ok: true }); });
const op = (summary: string, codes: string[]) => ({ summary, responses: Object.fromEntries(codes.map(c => [c, { description: c }])) });
const spec = { openapi: '3.0.3', info: { title: "Nivi's QA Playground API", version: '1.0.0' }, paths: {
  '/api/login': { post: op('Login', ['200', '400', '401']) }, '/api/logout': { post: op('Logout (Bearer)', ['200', '401']) },
  '/api/register': { post: op('Register', ['201', '400', '409']) }, '/api/me': { get: op('Current user (Bearer)', ['200', '401']) },
  '/api/admin': { get: op('Admin only (Bearer)', ['200', '401', '403']) }, '/api/products': { get: op('List: q, category, sort, page, size', ['200']) },
  '/api/products/{id}': { get: op('Product detail', ['200', '404']) },
  '/api/items': { get: op('List items', ['200']), post: op('Create item', ['201', '400']) },
  '/api/items/{id}': { put: op('Replace', ['200', '404']), patch: op('Update', ['200', '404']), delete: op('Delete', ['204', '404']) },
  '/api/status/{code}': { get: op('Return any HTTP status', ['200']) }, '/api/slow': { get: op('Delay via ?ms=', ['200']) } } };
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec as any));
if (fs.existsSync('dist')) { app.use(express.static('dist')); app.get('*', (_q, r) => r.sendFile(process.cwd() + '/dist/index.html')); }
const server = createServer(app); const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', ws => { ws.send('Welcome to Nivi WebSocket'); ws.on('message', m => ws.send('Echo: ' + m.toString())); });
server.listen(3001, () => console.log('API http://localhost:3001  Docs http://localhost:3001/api-docs'));
