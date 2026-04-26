const API_BASE = window.API_BASE || "";

const app = Vue.createApp({
  data() {
    return {
      apiState: "Booting",
      categories: [],
      products: [],
      selectedCategory: null,
      query: "",
      sessionToken: localStorage.getItem("cyber_store_token"),
      user: null,
      quoteState: null,
      debounceHandle: null,
    };
  },
  computed: {
    userLabel() {
      if (this.user?.first_name) return this.user.first_name;
      if (this.sessionToken) return "Session active";
      return "Telegram ready";
    },
  },
  async mounted() {
    await this.loadAll();
    await this.bootstrapTelegram();
    this.paintIcons();
  },
  updated() {
    this.paintIcons();
  },
  methods: {
    paintIcons() {
      this.$nextTick(() => window.lucide?.createIcons());
    },
    money(cents) {
      return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(cents / 100);
    },
    async request(path, options = {}) {
      const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
      if (this.sessionToken) headers.Authorization = `Bearer ${this.sessionToken}`;
      const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    async loadAll() {
      this.apiState = "Syncing";
      try {
        const [categories, products] = await Promise.all([this.request("/api/categories"), this.loadProducts()]);
        this.categories = categories.items;
        this.products = products.items;
        this.apiState = "Live";
      } catch (error) {
        this.apiState = "API offline";
        console.error(error);
      }
    },
    async loadProducts() {
      const params = new URLSearchParams();
      if (this.selectedCategory) params.set("category", this.selectedCategory);
      if (this.query.trim().length >= 2) params.set("q", this.query.trim());
      return this.request(`/api/products?${params.toString()}`);
    },
    async selectCategory(slug) {
      this.selectedCategory = slug;
      const result = await this.loadProducts();
      this.products = result.items;
    },
    debouncedLoad() {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = setTimeout(async () => {
        const result = await this.loadProducts();
        this.products = result.items;
      }, 220);
    },
    async bootstrapTelegram() {
      const initData = window.Telegram?.WebApp?.initData;
      if (!initData) return;
      const result = await this.request("/api/auth/telegram", {
        method: "POST",
        body: JSON.stringify({ init_data: initData }),
      });
      this.applySession(result);
      window.Telegram.WebApp.ready();
    },
    async login() {
      const result = await this.request("/api/auth/demo", {
        method: "POST",
        body: JSON.stringify({ telegram_id: 10001, username: "demo_buyer", first_name: "Demo" }),
      });
      this.applySession(result);
    },
    applySession(result) {
      this.sessionToken = result.token;
      this.user = result.user;
      localStorage.setItem("cyber_store_token", result.token);
    },
    async quote(product) {
      if (!this.sessionToken) await this.login();
      this.quoteState = await this.request("/api/orders/quote", {
        method: "POST",
        body: JSON.stringify([product.id]),
      });
    },
  },
});

app.mount("#app");
