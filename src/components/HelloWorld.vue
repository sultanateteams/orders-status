<template>
  <div class="p-4 form-wrapper">
    <h1 class="text-danger" v-if="errorText">{{ errorText }}</h1>

    <!-- Loading -->
    <div
      v-if="loading"
      class="d-flex justify-content-center align-items-center"
    >
      <b-spinner label="Yuklanmoqda..."></b-spinner>
      <span class="ms-2">Ma'lumotlar yuklanmoqda...</span>
    </div>

    <b-form v-else @submit.stop.prevent="handleSubmit">
      <h2>Filterlar</h2>

      <!-- Logistika turi -->
      <div class="mb-3">
        <label class="form-label">Logistika turini tanlang</label>
        <b-form-select
          v-model="formData.transport_type"
          :options="transportTypes"
        />
      </div>

      <!-- Joriy status -->
      <div class="mb-3">
        <label class="form-label">Joriy statusni tanlang</label>
        <b-form-select
          v-model="formData.current_status"
          :options="statusOptions"
          @change="onCurrentStatusChange"
        />
      </div>

      <!-- Yangi status -->
      <div class="mb-3">
        <label class="form-label">Yangi statusni tanlang</label>
        <b-form-select
          v-model="formData.new_status"
          :options="filteredNewStatuses"
        />
      </div>

      <!-- Orders table -->
      <div v-if="orders.length">
        <h2>Topilgan orderlar</h2>
        <b-table striped hover :items="orders" :fields="orderFields">
          <template #cell(select)="row">
            <b-form-checkbox
              :checked="checkedMap[row.item.order_id] || false"
              @change="toggleCheckbox(row.item.order_id)"
            />
          </template>
        </b-table>

        <!-- Submit tugmasi faqat tanlangan orderlar bo'lsa chiqadi -->
        <div v-if="selectedIds.length" class="mt-3 text-end">
          <b-button type="submit" variant="primary">Submit</b-button>
        </div>
      </div>
      <div v-else-if="allSelected">
        <p>Hech qanday order topilmadi</p>
      </div>
    </b-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import supabase from "../config/supabazaClient";

const errorText = ref("");
const loading = ref(false);
const orders = ref<any[]>([]);
const checkedMap = ref<Record<string, boolean>>({});

const Telegram = window.Telegram.WebApp;
const queryParams = new URLSearchParams(window.location.search);
const org_id =
  queryParams.get("org_id") || "f67f4a71-9a10-43ae-ad9f-91d7dfa565a1";

const formData = reactive({
  transport_type: null as string | null,
  current_status: null as string | null,
  new_status: null as string | null,
});

const transportTypes = [
  { value: "auto", text: "Auto/Fura" },
  { value: "air", text: "Havo" },
  { value: "rail", text: "Temir yo'l" },
  { value: "sea", text: "Dengiz" },
];

const orderFields = [
  { key: "select", label: "" },
  { key: "cargo_id", label: "Cargo ID" },
  { key: "barcode", label: "Barcode" },
  { key: "cost_price", label: "Narx" },
  { key: "volume", label: "Hajm" },
  { key: "weight", label: "Og'irlik" },
];

const statusOptions = ref<{ value: string; text: string; number: number }[]>(
  []
);
const allStatuses = ref<any[]>([]);

const filteredNewStatuses = computed(() => {
  if (!formData.current_status) return [];
  const current = allStatuses.value.find(
    (s) => s.key === formData.current_status
  );
  if (!current) return [];
  return allStatuses.value
    .filter((s) => s.number > current.number)
    .map((s) => ({ value: s.key, text: s.name }));
});

const allSelected = computed(() => {
  return !!(
    formData.transport_type &&
    formData.current_status &&
    formData.new_status
  );
});

// ✅ faqat checked bo'lgan order_id larni arrayga yig'ish
const selectedIds = computed(() =>
  orders.value
    .filter((o) => checkedMap.value[o.order_id])
    .map((o) => o.order_id)
);

const onCurrentStatusChange = () => {
  formData.new_status = null;
};

async function fetchStatuses() {
  try {
    const { data, error } = await supabase
      .from("lists")
      .select("number, name1, key_1")
      .eq("state", 1)
      .eq("type_id", 6)
      .order("number", { ascending: true });

    if (error) throw error;

    allStatuses.value = data.map((s: any) => ({
      number: s.number,
      name: s.name1,
      key: s.key_1,
    }));

    statusOptions.value = allStatuses.value.map((s: any) => ({
      value: s.key,
      text: s.name,
      number: s.number,
    }));
  } catch (err: any) {
    console.error("Statuslarni olishda xatolik:", err);
    errorText.value = "Statuslarni olishda xatolik yuz berdi";
  }
}

async function fetchOrders() {
  try {
    loading.value = true;
    errorText.value = "";

    const { data, error } = await supabase.rpc("get_orders", {
      p_org_id: org_id,
      p_transport: formData.transport_type,
      p_status: formData.current_status,
    });

    if (error) throw error;

    // ❗ Null order_id chiqib ketmasligi uchun filtr qo‘shildi
    orders.value = (data || []).filter((o: any) => o.order_id !== null);

    // Agar hech qanday order bo‘lmasa checkedMap ham bo‘sh bo‘lsin
    checkedMap.value = {};
    for (const o of orders.value) {
      checkedMap.value[o.order_id] = true;
    }
  } catch (err: any) {
    console.error("Orderlarni olishda xatolik:", err);
    errorText.value = "Orderlarni olishda xatolik yuz berdi";
  } finally {
    loading.value = false;
  }
}

function toggleCheckbox(orderId: string) {
  checkedMap.value[orderId] = !checkedMap.value[orderId];
}

function handleSubmit() {
  if (!selectedIds.value.length) return; // 🚫 hech narsa yubormasin

  Telegram.sendData(
    JSON.stringify({
      new_status: formData.new_status,
      order_ids: selectedIds.value,
    })
  );

  Telegram.close();
}

watch(
  () => [formData.transport_type, formData.current_status, formData.new_status],
  async () => {
    if (allSelected.value) {
      await fetchOrders();
    }
  }
);

onMounted(async () => {
  Telegram.ready();
  await fetchStatuses();
});
</script>
