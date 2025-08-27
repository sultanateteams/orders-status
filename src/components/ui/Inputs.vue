<template>
  <div class="mb-3">
    <label :for="id" class="form-label">{{ title }}</label>
    <!-- BootstrapVue qo‘llaydigan typelar bilan ishlaymiz -->
    <b-form-input
      class="w-100"
      :id="id"
      :value="localValue"
      @input="updateValue"
      :state="validationState"
      :type="supportedType"
    ></b-form-input>

    <b-form-invalid-feedback v-if="required && !validationState">
      {{ errorMessage }}
    </b-form-invalid-feedback>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineEmits, ref, watch } from "vue";

// Props
const props = defineProps<{
  modelValue: string | number | null;
  id: string;
  title: string;
  required?: boolean;
  type: string;
}>();

const emit = defineEmits(["update:modelValue"]);

// 1. Xavfsiz local value
const localValue = ref(props.modelValue ?? "");

// 2. Ruxsat etilgan BootstrapVue type'lar
const allowedTypes = [
  "text",
  "password",
  "email",
  "number",
  "url",
  "tel",
  "search",
  "range",
  "date",
  "time",
  "color",
];

const supportedType = computed(() => {
  return allowedTypes.includes(props.type) ? props.type : "text"; // noto‘g‘ri type bo‘lsa fallback
});

// 3. modelValue tashqi o‘zgarishga qarab yangilanadi
watch(
  () => props.modelValue,
  (val) => {
    localValue.value = val ?? "";
  }
);

// 4. Input qiymatini emit qilish
function updateValue(val: string | number) {
  localValue.value = val;
  emit("update:modelValue", val);
}

// 5. Validatsiya holati
const validationState = computed(() => {
  if (!props.required) return null;
  const val = String(localValue.value).trim();

  if (supportedType.value === "number") {
    return !isNaN(Number(val));
  }

  return val.length >= 3 && val.length <= 100;
});

const errorMessage = computed(() => {
  if (supportedType.value === "number") {
    return "Faqat raqam bo‘lishi kerak.";
  }
  return "Matn 3 dan 100 belgigacha bo‘lishi kerak.";
});
</script>
