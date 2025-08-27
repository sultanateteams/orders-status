import { createApp } from "vue";
import App from "./App.vue";

// bootstrap css
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue-3/dist/bootstrap-vue-3.css";

// bootstrap-vue-3 plugin
import BootstrapVue3 from "bootstrap-vue-3";

const app = createApp(App);

// bootstrap-vue-3 ni global qo'shish
app.use(BootstrapVue3);

app.mount("#app");
