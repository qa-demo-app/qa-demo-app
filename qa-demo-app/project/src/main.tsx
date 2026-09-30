import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

const api = async (path: string, opt: any = {}) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const r = await fetch(path, { ...opt, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opt.headers }, body: opt.body && JSON.stringify(opt.body) });
  const text = await r.text(); let data: any = text; try { data = JSON.parse(text); } catch {}
  return { status: r.status, data };
};
const Page = ({ id, title, children }: any) => <section><h1 data-testid={`${id}-title`}>{title}</h1>{children}</section>;
const Out = ({ v, id = 'output' }: any) => <pre data-testid={id} aria-live="polite">{typeof v === 'string' ? v : JSON.stringify(v, null, 2)}</pre>;
const Field = ({ label, id, err, ...p }: any) => <div><label htmlFor={id}>{label}</label><input id={id} data-testid={id} {...p} />{err && <span role="alert" data-testid={`${id}-error`}>{err}</span>}</div>;

function Login() {
  const [f, setF] = useState({ email: '', password: '', remember: false }); const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  const submit = async (e: any) => {
    e.preventDefault(); setErr(''); setOk('');
    if (!f.email) return setErr('Email is required'); if (!f.password) return setErr('Password is required');
    const r = await api('/api/login', { method: 'POST', body: f });
    if (r.status !== 200) return setErr(r.data.error);
    (f.remember ? localStorage : sessionStorage).setItem('token', r.data.token); setOk(`Welcome, ${r.data.user.name}`);
  };
  return <Page id="login" title="Login"><form onSubmit={submit} noValidate>
    <Field label="Email" id="login-email" type="email" value={f.email} onChange={(e: any) => setF({ ...f, email: e.target.value })} />
    <Field label="Password" id="login-password" type="password" value={f.password} onChange={(e: any) => setF({ ...f, password: e.target.value })} />
    <label><input type="checkbox" data-testid="login-remember" checked={f.remember} onChange={e => setF({ ...f, remember: e.target.checked })} /> Remember me</label>
    <button type="submit" data-testid="login-submit">Sign in</button></form>
    {err && <p role="alert" data-testid="login-error">{err}</p>}{ok && <p data-testid="login-success">{ok}</p>}
    <p>Valid: qa.tester@nivi.dev / Test@1234 &nbsp; Admin: admin@nivi.dev / Admin@1234</p></Page>;
}

function Register() {
  const [f, setF] = useState<any>({ name: '', email: '', password: '', confirm: '', terms: false }); const [e, setE] = useState<any>({}); const [msg, setMsg] = useState('');
  const submit = async (ev: any) => {
    ev.preventDefault(); const n: any = {};
    if (!f.name.trim()) n.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) n.email = 'Enter a valid email';
    if (!/^(?=.*\d).{8,}$/.test(f.password)) n.password = 'Min 8 chars incl. a number';
    if (f.confirm !== f.password) n.confirm = 'Passwords do not match';
    if (!f.terms) n.terms = 'Accept the terms';
    setE(n); setMsg(''); if (Object.keys(n).length) return;
    const r = await api('/api/register', { method: 'POST', body: f }); setMsg(r.status === 201 ? 'Registration successful' : r.data.error);
  };
  const set = (k: string) => (ev: any) => setF({ ...f, [k]: ev.target.value });
  return <Page id="register" title="Register"><form onSubmit={submit} noValidate>
    <Field label="Full name" id="reg-name" value={f.name} onChange={set('name')} err={e.name} />
    <Field label="Email" id="reg-email" value={f.email} onChange={set('email')} err={e.email} />
    <Field label="Password" id="reg-password" type="password" value={f.password} onChange={set('password')} err={e.password} />
    <Field label="Confirm password" id="reg-confirm" type="password" value={f.confirm} onChange={set('confirm')} err={e.confirm} />
    <label><input type="checkbox" data-testid="reg-terms" checked={f.terms} onChange={ev => setF({ ...f, terms: ev.target.checked })} /> I accept the terms</label>
    {e.terms && <span role="alert" data-testid="reg-terms-error">{e.terms}</span>}
    <button type="submit" data-testid="reg-submit">Create account</button></form><p data-testid="reg-message">{msg}</p></Page>;
}

function Products({ add }: any) {
  const [q, setQ] = useState(''); const [category, setC] = useState(''); const [sort, setS] = useState(''); const [page, setP] = useState(1); const [d, setD] = useState<any>({ items: [], total: 0 }); const [sel, setSel] = useState<any>(null);
  useEffect(() => { api(`/api/products?q=${q}&category=${category}&sort=${sort}&page=${page}`).then(r => setD(r.data)); }, [q, category, sort, page]);
  const pages = Math.max(1, Math.ceil(d.total / 6));
  return <Page id="products" title="Products">
    <input aria-label="Search products" data-testid="product-search" placeholder="Search" value={q} onChange={e => { setQ(e.target.value); setP(1); }} />
    <select aria-label="Category" data-testid="product-category" value={category} onChange={e => { setC(e.target.value); setP(1); }}><option value="">All</option><option>Electronics</option><option>Accessories</option><option>Displays</option></select>
    <select aria-label="Sort" data-testid="product-sort" value={sort} onChange={e => setS(e.target.value)}><option value="">Default</option><option value="name">Name</option><option value="price-asc">Price ↑</option><option value="price-desc">Price ↓</option></select>
    <p data-testid="product-count">{d.total} results</p>
    {d.items.length === 0 && <p data-testid="products-empty">No products found</p>}
    <ul className="grid">{d.items.map((p: any) => <li key={p.id} data-testid={`product-${p.id}`}><h3>{p.name}</h3><span data-testid={`product-price-${p.id}`}>${p.price}</span> <small>{p.category}</small><br />
      <button data-testid={`product-details-${p.id}`} onClick={() => setSel(p)}>Details</button> <button data-testid={`add-to-cart-${p.id}`} onClick={() => add(p)}>Add to cart</button></li>)}</ul>
    <button data-testid="page-prev" disabled={page <= 1} onClick={() => setP(page - 1)}>Prev</button> <span data-testid="page-indicator">Page {page} of {pages}</span> <button data-testid="page-next" disabled={page >= pages} onClick={() => setP(page + 1)}>Next</button>
    {sel && <div role="dialog" aria-label="Product details" data-testid="product-modal"><h2>{sel.name}</h2><p>{sel.description}</p><button data-testid="modal-close" onClick={() => setSel(null)}>Close</button></div>}</Page>;
}

function Cart({ cart, setCart }: any) {
  const [step, setStep] = useState('cart'); const [a, setA] = useState({ address: '', city: '', zip: '', card: '' }); const [err, setErr] = useState(''); const [order, setOrder] = useState('');
  const total = cart.reduce((s: number, i: any) => s + i.price * i.qty, 0);
  const upd = (id: number, d: number) => setCart(cart.map((i: any) => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i));
  const place = () => {
    if (!a.address || !a.city || !/^\d{5}$/.test(a.zip)) return setErr('Valid address, city and 5-digit ZIP required');
    if (!/^\d{16}$/.test(a.card)) return setErr('Card must be 16 digits (try 4111111111111111)');
    setOrder('ORD-' + Math.floor(100000 + Math.random() * 900000)); setCart([]); setStep('done');
  };
  if (step === 'done') return <Page id="order" title="Order Confirmation"><p data-testid="order-number">{order}</p><p>Thank you for your purchase!</p></Page>;
  return <Page id="cart" title="Cart">{cart.length === 0 ? <p data-testid="cart-empty">Your cart is empty</p> : <>
    <table><tbody>{cart.map((i: any) => <tr key={i.id} data-testid={`cart-row-${i.id}`}><td>{i.name}</td><td><button aria-label={`Decrease ${i.name}`} data-testid={`qty-dec-${i.id}`} onClick={() => upd(i.id, -1)}>-</button> <span data-testid={`qty-${i.id}`}>{i.qty}</span> <button aria-label={`Increase ${i.name}`} data-testid={`qty-inc-${i.id}`} onClick={() => upd(i.id, 1)}>+</button></td><td>${i.price * i.qty}</td><td><button data-testid={`remove-${i.id}`} onClick={() => setCart(cart.filter((x: any) => x.id !== i.id))}>Remove</button></td></tr>)}</tbody></table>
    <p data-testid="cart-total">Total: ${total}</p>
    {step === 'cart' ? <button data-testid="checkout-btn" onClick={() => setStep('checkout')}>Checkout</button> : <div>
      {(['address', 'city', 'zip', 'card'] as const).map(k => <Field key={k} label={k[0].toUpperCase() + k.slice(1)} id={`co-${k}`} value={a[k]} onChange={(e: any) => setA({ ...a, [k]: e.target.value })} />)}
      {err && <p role="alert" data-testid="checkout-error">{err}</p>}<button data-testid="place-order" onClick={place}>Place order</button></div>}</>}</Page>;
}

function Forms() {
  const [v, setV] = useState<any>({ text: '', dd: 'in', chk: [], radio: '', date: '', range: 50, area: '' }); const [out, setOut] = useState('');
  const tog = (x: string) => setV({ ...v, chk: v.chk.includes(x) ? v.chk.filter((y: string) => y !== x) : [...v.chk, x] });
  return <Page id="forms" title="Forms Playground"><form onSubmit={e => { e.preventDefault(); setOut(JSON.stringify(v)); }}>
    <Field label="Textbox" id="f-text" value={v.text} onChange={(e: any) => setV({ ...v, text: e.target.value })} />
    <label htmlFor="f-dd">Country</label><select id="f-dd" data-testid="f-dd" value={v.dd} onChange={e => setV({ ...v, dd: e.target.value })}><option value="in">India</option><option value="us">USA</option><option value="uk">UK</option></select>
    <fieldset><legend>Hobbies</legend>{['Reading', 'Music', 'Sports'].map(h => <label key={h}><input type="checkbox" data-testid={`f-chk-${h.toLowerCase()}`} checked={v.chk.includes(h)} onChange={() => tog(h)} />{h}</label>)}</fieldset>
    <fieldset><legend>Gender</legend>{['Female', 'Male', 'Other'].map(g => <label key={g}><input type="radio" name="g" data-testid={`f-radio-${g.toLowerCase()}`} checked={v.radio === g} onChange={() => setV({ ...v, radio: g })} />{g}</label>)}</fieldset>
    <Field label="Date of birth" id="f-date" type="date" value={v.date} onChange={(e: any) => setV({ ...v, date: e.target.value })} />
    <Field label="Rating" id="f-range" type="range" min="0" max="100" value={v.range} onChange={(e: any) => setV({ ...v, range: +e.target.value })} /><output data-testid="f-range-value">{v.range}</output>
    <label htmlFor="f-area">Comments</label><textarea id="f-area" data-testid="f-area" value={v.area} onChange={e => setV({ ...v, area: e.target.value })} />
    <button type="submit" data-testid="f-submit">Submit</button></form><Out v={out} id="f-result" /></Page>;
}

const PEOPLE = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: ['Asha', 'Ravi', 'Meena', 'Karthik', 'Divya', 'Suresh'][i % 6] + ' ' + String.fromCharCode(65 + i), role: ['QA', 'Dev', 'PM'][i % 3], age: 22 + i * 2 }));
function Tables() {
  const [rows, setRows] = useState(PEOPLE); const [q, setQ] = useState(''); const [role, setRole] = useState(''); const [dir, setDir] = useState(1); const [page, setPage] = useState(1); const [edit, setEdit] = useState<number | null>(null);
  const list = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) && (!role || r.role === role)).sort((a, b) => a.name.localeCompare(b.name) * dir);
  const pages = Math.max(1, Math.ceil(list.length / 5)); const view = list.slice((page - 1) * 5, page * 5);
  return <Page id="tables" title="Tables">
    <input aria-label="Search table" data-testid="table-search" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
    <select aria-label="Role filter" data-testid="table-role" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}><option value="">All</option><option>QA</option><option>Dev</option><option>PM</option></select>
    <table data-testid="data-table"><thead><tr><th><button data-testid="sort-name" onClick={() => setDir(-dir)}>Name {dir > 0 ? '▲' : '▼'}</button></th><th>Role</th><th>Age</th><th>Actions</th></tr></thead>
      <tbody>{view.map(r => <tr key={r.id} data-testid={`row-${r.id}`}><td>{edit === r.id ? <input aria-label="Edit name" data-testid={`edit-input-${r.id}`} defaultValue={r.name} onBlur={e => { setRows(rows.map(x => x.id === r.id ? { ...x, name: e.target.value } : x)); setEdit(null); }} autoFocus /> : r.name}</td><td>{r.role}</td><td>{r.age}</td>
        <td><button data-testid={`edit-${r.id}`} onClick={() => setEdit(r.id)}>Edit</button> <button data-testid={`delete-${r.id}`} onClick={() => setRows(rows.filter(x => x.id !== r.id))}>Delete</button></td></tr>)}</tbody></table>
    {view.length === 0 && <p data-testid="table-empty">No rows</p>}
    <button data-testid="tbl-prev" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button> <span data-testid="tbl-page">Page {page} of {pages}</span> <button data-testid="tbl-next" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></Page>;
}

function Alerts() {
  const [o, setO] = useState('');
  return <Page id="alerts" title="Alerts"><button data-testid="btn-alert" onClick={() => { alert('Hello from Nivi!'); setO('Alert closed'); }}>Alert</button>
    <button data-testid="btn-confirm" onClick={() => setO(confirm('Are you sure?') ? 'You pressed OK' : 'You pressed Cancel')}>Confirm</button>
    <button data-testid="btn-prompt" onClick={() => { const n = prompt('Your name?', 'Guest'); setO(n === null ? 'Prompt cancelled' : `Hello, ${n}`); }}>Prompt</button><Out v={o} id="alert-result" /></Page>;
}

const inner = '<h2 id=inner>Inner frame</h2><button id=inner-btn onclick="this.textContent=\'Clicked inner\'">Click inner</button>';
const outer = `<h2 id=outer>Outer frame</h2><button id=outer-btn onclick="this.textContent='Clicked outer'">Click outer</button><iframe title="nested-frame" data-testid="nested-frame" srcdoc="${inner.replace(/"/g, '&quot;')}"></iframe>`;
const Frames = () => <Page id="frames" title="Frames"><iframe title="simple-frame" data-testid="simple-frame" srcDoc={inner} /><iframe title="outer-frame" data-testid="outer-frame" srcDoc={outer} /></Page>;

const Windows = () => <Page id="windows" title="Windows / Tabs"><button data-testid="open-popup" onClick={() => window.open('/#/popup', 'popup', 'width=400,height=300')}>Open popup</button>
  <a href="/#/popup" target="_blank" rel="noopener" data-testid="open-tab">Open new tab</a> <a href="/#/products" target="_blank" rel="noopener" data-testid="open-tab-2">Open products tab</a></Page>;
const Popup = () => <Page id="popup" title="Popup Window"><p data-testid="popup-text">I am a child window</p></Page>;

function Upload() {
  const [files, setFiles] = useState<string[]>([]);
  return <Page id="upload" title="File Upload"><label htmlFor="single">Single file</label><input id="single" type="file" data-testid="upload-single" onChange={e => setFiles(Array.from(e.target.files || []).map(f => f.name))} />
    <label htmlFor="multi">Multiple files</label><input id="multi" type="file" multiple data-testid="upload-multi" onChange={e => setFiles(Array.from(e.target.files || []).map(f => f.name))} />
    <ul data-testid="upload-list">{files.map(f => <li key={f}>{f}</li>)}</ul><p data-testid="upload-count">{files.length} file(s) selected</p></Page>;
}

function Drag() {
  const [l, setL] = useState(['Item 1', 'Item 2', 'Item 3', 'Item 4']); const from = useRef(-1);
  return <Page id="drag" title="Drag & Drop"><ul data-testid="sortable">{l.map((x, i) => <li key={x} draggable data-testid={`drag-${i + 1}`} onDragStart={() => (from.current = i)} onDragOver={e => e.preventDefault()}
    onDrop={() => { const n = [...l]; const [m] = n.splice(from.current, 1); n.splice(i, 0, m); setL(n); }}>{x}</li>)}</ul></Page>;
}

function MouseKb() {
  const [o, setO] = useState({ hover: 'not hovered', ctx: '', dbl: '', key: '' });
  return <Page id="mk" title="Mouse & Keyboard"><div tabIndex={0} data-testid="hover-box" onMouseEnter={() => setO({ ...o, hover: 'hovered' })} onMouseLeave={() => setO({ ...o, hover: 'not hovered' })}>Hover me</div><p data-testid="hover-status">{o.hover}</p>
    <div data-testid="ctx-box" onContextMenu={e => { e.preventDefault(); setO({ ...o, ctx: 'Right-clicked' }); }}>Right-click me</div><p data-testid="ctx-status">{o.ctx}</p>
    <button data-testid="dbl-btn" onDoubleClick={() => setO({ ...o, dbl: 'Double-clicked' })}>Double-click me</button><p data-testid="dbl-status">{o.dbl}</p>
    <input aria-label="Keyboard input" data-testid="key-input" onKeyDown={e => setO({ ...o, key: `${e.ctrlKey ? 'Ctrl+' : ''}${e.key}` })} /><p data-testid="key-status">{o.key}</p></Page>;
}

function ApiPlayground() {
  const [m, setM] = useState('GET'); const [url, setUrl] = useState('/api/items'); const [body, setBody] = useState('{"name":"Keyboard","qty":2}'); const [res, setRes] = useState<any>({});
  const send = async () => { let b; try { b = ['GET', 'DELETE'].includes(m) ? undefined : JSON.parse(body); } catch { return setRes({ status: 0, data: 'Invalid JSON body' }); } setRes(await api(url, { method: m, body: b })); };
  return <Page id="api" title="API Playground"><select aria-label="Method" data-testid="api-method" value={m} onChange={e => setM(e.target.value)}>{['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(x => <option key={x}>{x}</option>)}</select>
    <input aria-label="URL" data-testid="api-url" value={url} onChange={e => setUrl(e.target.value)} /><textarea aria-label="Request body" data-testid="api-body" value={body} onChange={e => setBody(e.target.value)} />
    <button data-testid="api-send" onClick={send}>Send</button><p>Status: <span data-testid="api-status">{res.status}</span></p><Out v={res.data ?? ''} id="api-response" /><a href="/api-docs" data-testid="swagger-link">Swagger docs</a></Page>;
}

function Network() {
  const [r, setR] = useState<any>({}); const [busy, setBusy] = useState(false); const [mock, setMock] = useState(false);
  const call = async (u: string) => { setBusy(true); setR(mock ? { status: 200, data: { mocked: true } } : await api(u)); setBusy(false); };
  return <Page id="network" title="Network Testing"><label><input type="checkbox" data-testid="mock-toggle" checked={mock} onChange={e => setMock(e.target.checked)} /> Use built-in mock</label>
    <div>{[200, 400, 401, 403, 404, 500].map(c => <button key={c} data-testid={`status-${c}`} onClick={() => call(`/api/status/${c}`)}>{c}</button>)}<button data-testid="status-slow" onClick={() => call('/api/slow?ms=3000')}>Slow (3s)</button>
      <button data-testid="status-products" onClick={() => call('/api/products')}>Products (mock target)</button></div>
    {busy && <p role="status" data-testid="net-loading">Loading…</p>}<p>Status: <span data-testid="net-status">{r.status}</span></p><Out v={r.data ?? ''} id="net-response" /></Page>;
}

function Auth() {
  const [me, setMe] = useState<any>(null); const tk = localStorage.getItem('token') || sessionStorage.getItem('token');
  const load = async () => setMe(await api('/api/me'));
  const logout = async () => { await api('/api/logout', { method: 'POST' }); localStorage.removeItem('token'); sessionStorage.removeItem('token'); setMe({ status: 0, data: 'Logged out' }); };
  return <Page id="auth" title="Authentication"><p data-testid="token-value">{tk || 'no token'}</p><button data-testid="get-me" onClick={load}>GET /api/me</button> <button data-testid="get-admin" onClick={async () => setMe(await api('/api/admin'))}>GET /api/admin</button>
    <button data-testid="expire-token" onClick={() => { localStorage.setItem('token', 'expired'); sessionStorage.removeItem('token'); }}>Expire token</button> <button data-testid="logout-btn" onClick={logout}>Logout</button>
    {me && <><p>Status: <span data-testid="auth-status">{me.status}</span></p><Out v={me.data} id="auth-response" /></>}</Page>;
}

function Sockets() {
  const [msgs, setMsgs] = useState<string[]>([]); const [t, setT] = useState(''); const ws = useRef<WebSocket>(); const [st, setSt] = useState('connecting');
  useEffect(() => { const w = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`); ws.current = w; w.onopen = () => setSt('connected'); w.onclose = () => setSt('closed'); w.onmessage = e => setMsgs(m => [...m, e.data]); return () => w.close(); }, []);
  return <Page id="ws" title="WebSocket"><p data-testid="ws-status">{st}</p><input aria-label="Message" data-testid="ws-input" value={t} onChange={e => setT(e.target.value)} /><button data-testid="ws-send" onClick={() => { ws.current?.send(t); setT(''); }}>Send</button>
    <ul data-testid="ws-messages">{msgs.map((m, i) => <li key={i}>{m}</li>)}</ul></Page>;
}

function Errors() {
  const [s, setS] = useState('');
  return <Page id="errors" title="Error Pages"><button data-testid="show-loading" onClick={() => { setS('loading'); setTimeout(() => setS('done'), 2500); }}>Loading state</button> <button data-testid="show-empty" onClick={() => setS('empty')}>Empty state</button> <button data-testid="show-500" onClick={() => setS('500')}>500 error</button>
    <a href="/#/does-not-exist" data-testid="go-404">Go to missing page</a>{s === 'loading' && <p role="status" data-testid="state-loading">Loading…</p>}{s === 'done' && <p data-testid="state-done">Loaded!</p>}
    {s === 'empty' && <p data-testid="state-empty">Nothing here yet</p>}{s === '500' && <div role="alert" data-testid="state-500"><h2>500 – Internal Server Error</h2></div>}</Page>;
}
const NotFound = () => <Page id="notfound" title="404 – Page Not Found"><p data-testid="notfound-text">The page you requested does not exist.</p><a href="/#/">Back home</a></Page>;

const NAV: [string, string][] = [['login', 'Login'], ['register', 'Register'], ['products', 'Products'], ['cart', 'Cart'], ['forms', 'Forms'], ['tables', 'Tables'], ['alerts', 'Alerts'], ['frames', 'Frames'], ['windows', 'Windows'], ['upload', 'Upload'], ['drag', 'Drag & Drop'], ['mouse', 'Mouse & Keyboard'], ['api', 'API'], ['network', 'Network'], ['auth', 'Auth'], ['websocket', 'WebSocket'], ['errors', 'Errors']];
function App() {
  const [h, setH] = useState(location.hash.slice(2) || 'home'); const [cart, setCart] = useState<any[]>([]);
  useEffect(() => { const f = () => setH(location.hash.slice(2) || 'home'); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  const add = (p: any) => setCart(c => c.find(i => i.id === p.id) ? c.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...c, { ...p, qty: 1 }]);
  const pages: any = { login: <Login />, register: <Register />, products: <Products add={add} />, cart: <Cart cart={cart} setCart={setCart} />, forms: <Forms />, tables: <Tables />, alerts: <Alerts />, frames: <Frames />, windows: <Windows />, upload: <Upload />, drag: <Drag />, mouse: <MouseKb />, api: <ApiPlayground />, network: <Network />, auth: <Auth />, websocket: <Sockets />, errors: <Errors />, popup: <Popup />,
    home: <Page id="home" title="Nivi's QA Automation Playground"><p>Practice Playwright, Selenium, API testing and CI/CD. Pick a page above.</p></Page> };
  return <><style>{`body{font-family:system-ui,sans-serif;margin:0}nav{display:flex;flex-wrap:wrap;gap:8px;padding:12px;background:#1e293b}nav a{color:#fff;text-decoration:none;padding:4px 8px;border-radius:4px}nav a[aria-current=page]{background:#6366f1}main{padding:16px;max-width:900px;margin:auto}input,select,textarea,button{margin:4px;padding:6px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;list-style:none;padding:0}.grid li,[role=dialog]{border:1px solid #cbd5e1;padding:12px;border-radius:8px}[role=alert]{color:#b91c1c}li[draggable]{padding:8px;border:1px solid #94a3b8;margin:4px;cursor:grab;list-style:none}iframe{width:100%;height:160px;border:1px solid #94a3b8}[data-testid=hover-box],[data-testid=ctx-box]{padding:24px;background:#e2e8f0;margin:4px}`}</style>
    {h !== 'popup' && <nav aria-label="Main">{NAV.map(([k, l]) => <a key={k} href={`#/${k === 'mouse' ? 'mouse' : k}`} data-testid={`nav-${k}`} aria-current={h === k ? 'page' : undefined}>{l}{k === 'cart' && cart.length ? ` (${cart.reduce((s, i) => s + i.qty, 0)})` : ''}</a>)}</nav>}
    <main>{pages[h] || <NotFound />}</main></>;
}
createRoot(document.getElementById('root')!).render(<App />);
