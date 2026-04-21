import dns from "dns";
import pgPkg from "pg";
const { Pool } = pgPkg;

import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
import { DATABASE_URL } from "./env.js";

// Patch dns.lookup to fall back to Google Public DNS when system DNS fails.
// Needed because some networks/VPNs block long subdomain lookups (e.g. Neon).
const _originalLookup = dns.lookup;
dns.lookup = function patchedLookup(hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  _originalLookup.call(dns, hostname, options, (err, address, family) => {
    if (!err) return callback(null, address, family);
    // System DNS failed — try Google Public DNS via dns.Resolver
    const resolver = new dns.Resolver();
    resolver.setServers(["8.8.8.8", "8.8.4.4"]);
    resolver.resolve4(hostname, (resolveErr, addresses) => {
      if (resolveErr) return callback(err); // return original error
      console.log(`DNS fallback resolved ${hostname} → ${addresses[0]}`);
      if (options.all) {
        callback(null, addresses.map((a) => ({ address: a, family: 4 })));
      } else {
        callback(null, addresses[0], 4);
      }
    });
  });
};

// Configure connection pool with proper limits
const pool = new Pool({ 
  connectionString: DATABASE_URL,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 15000, // Connection timeout 15 seconds
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

export default prisma;
