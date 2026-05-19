// Proper RESP protocol Redis mock server
import { createServer } from 'net';

const store = new Map();
const expires = new Map();
const lists = new Map();
const hashes = new Map();
const sets = new Map();

function isExpired(key) {
  if (expires.has(key) && Date.now() > expires.get(key)) {
    store.delete(key);
    lists.delete(key);
    hashes.delete(key);
    sets.delete(key);
    expires.delete(key);
    return true;
  }
  return false;
}

function bulk(s) {
  if (s === null || s === undefined) return '$-1\r\n';
  const b = Buffer.from(String(s), 'utf8');
  return `$${b.length}\r\n${s}\r\n`;
}
function int(n) { return `:${n}\r\n`; }
function ok() { return '+OK\r\n'; }
function err(msg) { return `-ERR ${msg}\r\n`; }
function arr(items) {
  if (!items) return '*-1\r\n';
  return `*${items.length}\r\n` + items.join('');
}

// INFO string (properly computed)
const INFO_DATA = `# Server\r\nredis_version:7.0.0\r\nredis_mode:standalone\r\nos:Windows\r\narch_bits:64\r\n# Clients\r\nconnected_clients:1\r\n# Memory\r\nused_memory:1000000\r\nused_memory_human:1.00M\r\n# Stats\r\ntotal_commands_processed:1000\r\n# Replication\r\nrole:master\r\n`;

function handleCommand(args) {
  const cmd = (args[0] || '').toUpperCase();

  switch (cmd) {
    case 'PING': return args[1] ? bulk(args[1]) : '+PONG\r\n';
    case 'QUIT': return ok();
    case 'AUTH': return ok();
    case 'SELECT': return ok();
    case 'FLUSHDB':
    case 'FLUSHALL':
      store.clear(); expires.clear(); lists.clear(); hashes.clear(); sets.clear();
      return ok();
    case 'CLIENT': return ok();
    case 'CONFIG':
      if ((args[1] || '').toUpperCase() === 'SET') return ok();
      if ((args[1] || '').toUpperCase() === 'GET') return '*0\r\n';
      return ok();

    case 'INFO': {
      const b = Buffer.from(INFO_DATA, 'utf8');
      return `$${b.length}\r\n${INFO_DATA}\r\n`;
    }

    case 'SET': {
      const [, key, val, ...rest] = args;
      store.set(key, val);
      // Handle EX / PX / EXAT options
      for (let i = 0; i < rest.length; i++) {
        const opt = (rest[i] || '').toUpperCase();
        if (opt === 'EX' && rest[i + 1]) {
          expires.set(key, Date.now() + parseInt(rest[i + 1]) * 1000);
        } else if (opt === 'PX' && rest[i + 1]) {
          expires.set(key, Date.now() + parseInt(rest[i + 1]));
        } else if (opt === 'NX') {
          if (store.has(key) && !isExpired(key)) { store.delete(key); return '$-1\r\n'; }
        }
      }
      return ok();
    }
    case 'SETNX': {
      const [, key, val] = args;
      if (store.has(key) && !isExpired(key)) return int(0);
      store.set(key, val);
      return int(1);
    }
    case 'GET': {
      const key = args[1];
      if (isExpired(key)) return '$-1\r\n';
      return store.has(key) ? bulk(store.get(key)) : '$-1\r\n';
    }
    case 'MGET': {
      return arr(args.slice(1).map(k => {
        if (isExpired(k) || !store.has(k)) return '$-1\r\n';
        return bulk(store.get(k));
      }));
    }
    case 'DEL': {
      let n = 0;
      for (const k of args.slice(1)) {
        if (store.delete(k) || lists.delete(k) || hashes.delete(k) || sets.delete(k)) n++;
        expires.delete(k);
      }
      return int(n);
    }
    case 'EXISTS': {
      let n = 0;
      for (const k of args.slice(1)) if (!isExpired(k) && (store.has(k) || lists.has(k) || hashes.has(k) || sets.has(k))) n++;
      return int(n);
    }
    case 'EXPIRE': {
      const [, key, ttl] = args;
      if (!store.has(key) && !lists.has(key) && !hashes.has(key) && !sets.has(key)) return int(0);
      expires.set(key, Date.now() + parseInt(ttl) * 1000);
      return int(1);
    }
    case 'PEXPIRE': {
      const [, key, ms] = args;
      expires.set(key, Date.now() + parseInt(ms));
      return int(1);
    }
    case 'TTL': {
      const key = args[1];
      if (!store.has(key) && !lists.has(key)) return int(-2);
      if (!expires.has(key)) return int(-1);
      return int(Math.max(0, Math.ceil((expires.get(key) - Date.now()) / 1000)));
    }
    case 'PTTL': {
      const key = args[1];
      if (!store.has(key)) return int(-2);
      if (!expires.has(key)) return int(-1);
      return int(Math.max(0, expires.get(key) - Date.now()));
    }
    case 'INCR': {
      const key = args[1];
      const v = parseInt(store.get(key) || '0') + 1;
      store.set(key, String(v));
      return int(v);
    }
    case 'INCRBY': {
      const key = args[1], by = parseInt(args[2] || '1');
      const v = parseInt(store.get(key) || '0') + by;
      store.set(key, String(v));
      return int(v);
    }
    case 'DECR': {
      const key = args[1];
      const v = parseInt(store.get(key) || '0') - 1;
      store.set(key, String(v));
      return int(v);
    }
    case 'DECRBY': {
      const key = args[1], by = parseInt(args[2] || '1');
      const v = parseInt(store.get(key) || '0') - by;
      store.set(key, String(v));
      return int(v);
    }
    case 'APPEND': {
      const key = args[1];
      const v = (store.get(key) || '') + args[2];
      store.set(key, v);
      return int(Buffer.byteLength(v));
    }
    case 'STRLEN': {
      const v = store.get(args[1]) || '';
      return int(Buffer.byteLength(v));
    }
    case 'KEYS': {
      const pattern = (args[1] || '*');
      const re = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      const all = [...new Set([...store.keys(), ...lists.keys(), ...hashes.keys(), ...sets.keys()])];
      const keys = all.filter(k => !isExpired(k) && re.test(k));
      return arr(keys.map(k => bulk(k)));
    }
    case 'SCAN': {
      // Simple SCAN: cursor=0 returns all, cursor!=0 returns empty
      const cursor = args[1];
      if (cursor === '0') {
        const all = [...store.keys()].filter(k => !isExpired(k));
        return `*2\r\n$1\r\n0\r\n${arr(all.map(k => bulk(k)))}`;
      }
      return `*2\r\n$1\r\n0\r\n*0\r\n`;
    }
    case 'TYPE': {
      const key = args[1];
      if (isExpired(key)) return '+none\r\n';
      if (lists.has(key)) return '+list\r\n';
      if (hashes.has(key)) return '+hash\r\n';
      if (sets.has(key)) return '+set\r\n';
      if (store.has(key)) return '+string\r\n';
      return '+none\r\n';
    }
    case 'OBJECT': return '$-1\r\n';

    // Hash commands
    case 'HSET': {
      const key = args[1];
      if (!hashes.has(key)) hashes.set(key, new Map());
      const h = hashes.get(key);
      let n = 0;
      for (let i = 2; i < args.length; i += 2) {
        if (!h.has(args[i])) n++;
        h.set(args[i], args[i + 1] || '');
      }
      return int(n);
    }
    case 'HMSET': {
      const key = args[1];
      if (!hashes.has(key)) hashes.set(key, new Map());
      const h = hashes.get(key);
      for (let i = 2; i < args.length; i += 2) h.set(args[i], args[i + 1] || '');
      return ok();
    }
    case 'HGET': {
      const h = hashes.get(args[1]);
      const v = h?.get(args[2]);
      return v !== undefined ? bulk(v) : '$-1\r\n';
    }
    case 'HMGET': {
      const h = hashes.get(args[1]);
      return arr(args.slice(2).map(f => {
        const v = h?.get(f);
        return v !== undefined ? bulk(v) : '$-1\r\n';
      }));
    }
    case 'HGETALL': {
      const h = hashes.get(args[1]);
      if (!h || h.size === 0) return '*0\r\n';
      const items = [];
      for (const [k, v] of h) { items.push(bulk(k)); items.push(bulk(v)); }
      return `*${items.length}\r\n${items.join('')}`;
    }
    case 'HDEL': {
      const h = hashes.get(args[1]);
      if (!h) return int(0);
      let n = 0;
      for (const f of args.slice(2)) if (h.delete(f)) n++;
      return int(n);
    }
    case 'HEXISTS': {
      return int(hashes.get(args[1])?.has(args[2]) ? 1 : 0);
    }
    case 'HLEN': {
      return int(hashes.get(args[1])?.size || 0);
    }
    case 'HKEYS': {
      const h = hashes.get(args[1]);
      if (!h) return '*0\r\n';
      return arr([...h.keys()].map(k => bulk(k)));
    }
    case 'HVALS': {
      const h = hashes.get(args[1]);
      if (!h) return '*0\r\n';
      return arr([...h.values()].map(v => bulk(v)));
    }
    case 'HINCRBY': {
      const h = hashes.get(args[1]) || new Map();
      hashes.set(args[1], h);
      const v = parseInt(h.get(args[2]) || '0') + parseInt(args[3] || '1');
      h.set(args[2], String(v));
      return int(v);
    }

    // List commands
    case 'LPUSH': {
      const key = args[1];
      if (!lists.has(key)) lists.set(key, []);
      const list = lists.get(key);
      for (let i = 2; i < args.length; i++) list.unshift(args[i]);
      return int(list.length);
    }
    case 'RPUSH': {
      const key = args[1];
      if (!lists.has(key)) lists.set(key, []);
      const list = lists.get(key);
      for (let i = 2; i < args.length; i++) list.push(args[i]);
      return int(list.length);
    }
    case 'LPOP': {
      const list = lists.get(args[1]);
      if (!list || list.length === 0) return '$-1\r\n';
      return bulk(list.shift());
    }
    case 'RPOP': {
      const list = lists.get(args[1]);
      if (!list || list.length === 0) return '$-1\r\n';
      return bulk(list.pop());
    }
    case 'LRANGE': {
      const list = lists.get(args[1]) || [];
      const start = parseInt(args[2]);
      const stop = parseInt(args[3]);
      const slice = stop === -1 ? list.slice(start) : list.slice(start, stop + 1);
      return arr(slice.map(v => bulk(v)));
    }
    case 'LLEN': {
      return int(lists.get(args[1])?.length || 0);
    }
    case 'LREM': return int(0);
    case 'LINDEX': {
      const list = lists.get(args[1]) || [];
      const idx = parseInt(args[2]);
      const v = list[idx < 0 ? list.length + idx : idx];
      return v !== undefined ? bulk(v) : '$-1\r\n';
    }
    case 'LSET': {
      const list = lists.get(args[1]);
      if (!list) return err('no such key');
      const idx = parseInt(args[2]);
      list[idx < 0 ? list.length + idx : idx] = args[3];
      return ok();
    }

    // Set commands
    case 'SADD': {
      const key = args[1];
      if (!sets.has(key)) sets.set(key, new Set());
      const s = sets.get(key);
      let n = 0;
      for (const m of args.slice(2)) if (!s.has(m)) { s.add(m); n++; }
      return int(n);
    }
    case 'SREM': {
      const s = sets.get(args[1]);
      if (!s) return int(0);
      let n = 0;
      for (const m of args.slice(2)) if (s.delete(m)) n++;
      return int(n);
    }
    case 'SMEMBERS': {
      const s = sets.get(args[1]);
      if (!s) return '*0\r\n';
      return arr([...s].map(m => bulk(m)));
    }
    case 'SISMEMBER': {
      return int(sets.get(args[1])?.has(args[2]) ? 1 : 0);
    }
    case 'SCARD': {
      return int(sets.get(args[1])?.size || 0);
    }

    // Sorted set (ZSet) - minimal
    case 'ZADD': return int(1);
    case 'ZRANGE': return '*0\r\n';
    case 'ZREVRANGE': return '*0\r\n';
    case 'ZCARD': return int(0);
    case 'ZRANK': return '$-1\r\n';
    case 'ZSCORE': return '$-1\r\n';
    case 'ZINCRBY': return bulk(args[3] || '0');
    case 'ZRANGEBYSCORE': return '*0\r\n';

    // Pub/Sub (minimal - no actual routing)
    case 'SUBSCRIBE': {
      const channel = args[1] || 'x';
      return `*3\r\n$9\r\nsubscribe\r\n${bulk(channel)}:1\r\n`;
    }
    case 'PSUBSCRIBE': {
      const pattern = args[1] || '*';
      return `*3\r\n$10\r\npsubscribe\r\n${bulk(pattern)}:1\r\n`;
    }
    case 'UNSUBSCRIBE': return `*3\r\n$11\r\nunsubscribe\r\n$-1\r\n:0\r\n`;
    case 'PUBLISH': return int(0);

    // BullMQ specific
    case 'XADD': return bulk('0-1');
    case 'XLEN': return int(0);
    case 'XREAD': return '*-1\r\n';
    case 'XRANGE': return '*0\r\n';
    case 'XREVRANGE': return '*0\r\n';
    case 'XACK': return int(1);
    case 'XGROUP': return ok();
    case 'XREADGROUP': return '*0\r\n';
    case 'XPENDING': return '*0\r\n';
    case 'XTRIM': return int(0);
    case 'XDEL': return int(1);
    case 'XINFO': return '*0\r\n';
    case 'BITFIELD': return '*0\r\n';
    case 'COMMAND': {
      if ((args[1] || '').toUpperCase() === 'INFO') return '*0\r\n';
      return int(0);
    }
    case 'WAIT': return int(0);
    case 'MULTI': return ok();
    case 'EXEC': return '*0\r\n';
    case 'DISCARD': return ok();
    case 'RESET': return '+RESET\r\n';
    case 'HELLO': {
      // Return minimal HELLO response
      return `*14\r\n$6\r\nserver\r\n$5\r\nredis\r\n$7\r\nversion\r\n$5\r\n7.0.0\r\n$5\r\nproto\r\n:2\r\n$2\r\nid\r\n:1\r\n$4\r\nmode\r\n$10\r\nstandalone\r\n$4\r\nrole\r\n$6\r\nmaster\r\n$7\r\nmodules\r\n*0\r\n`;
    }
    case 'EVAL':
    case 'EVALSHA':
    case 'BRPOPLPUSH':
      return ok();

    default:
      console.log(`[Redis] Unhandled command: ${cmd} ${args.slice(1).join(' ')}`);
      return err(`unknown command '${cmd}'`);
  }
}

// RESP parser
function parseCommands(buf) {
  const commands = [];
  let pos = 0;
  const str = buf;

  while (pos < str.length) {
    if (str[pos] !== '*') {
      // Inline command
      const end = str.indexOf('\r\n', pos);
      if (end === -1) break;
      const line = str.slice(pos, end);
      if (line.trim()) commands.push({ args: line.trim().split(/\s+/), consumed: end + 2 - pos });
      pos = end + 2;
      continue;
    }

    const countEnd = str.indexOf('\r\n', pos);
    if (countEnd === -1) break;
    const count = parseInt(str.slice(pos + 1, countEnd));
    if (isNaN(count)) { pos++; continue; }

    let i = countEnd + 2;
    const args = [];
    let ok = true;

    for (let a = 0; a < count; a++) {
      if (str[i] !== '$') { ok = false; break; }
      const lenEnd = str.indexOf('\r\n', i);
      if (lenEnd === -1) { ok = false; break; }
      const len = parseInt(str.slice(i + 1, lenEnd));
      i = lenEnd + 2;
      if (i + len > str.length) { ok = false; break; }
      args.push(str.slice(i, i + len));
      i += len + 2; // skip \r\n
    }

    if (!ok) break;
    commands.push({ args, consumed: i - pos });
    pos = i;
  }

  return { commands, remaining: str.slice(pos) };
}

const clients = new Set();

const server = createServer((socket) => {
  clients.add(socket);
  let buffer = '';

  socket.on('data', (data) => {
    buffer += data.toString('binary');
    const { commands, remaining } = parseCommands(buffer);
    buffer = remaining;

    for (const { args } of commands) {
      if (!args || args.length === 0) continue;
      try {
        const resp = handleCommand(args);
        socket.write(resp, 'binary');
      } catch (e) {
        socket.write(`-ERR ${e.message}\r\n`, 'binary');
      }
    }
  });

  socket.on('error', () => {});
  socket.on('close', () => clients.delete(socket));
});

server.listen(6379, '127.0.0.1', () => {
  console.log('[Redis Mock] Server ready on redis://127.0.0.1:6379');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('[Redis Mock] Port 6379 already in use! Something else is already running.');
  } else {
    console.error('[Redis Mock] Error:', e.message);
  }
  process.exit(1);
});
