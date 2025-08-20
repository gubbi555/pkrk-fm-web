class APICache {
  constructor(defaultTTL = 300000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, data, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

export default new APICache();
