<template>
  <div class="mb-4">
    <FloatLabel class="w-full" variant="on">
      <InputMask
        :id="id"
        v-model="inputValue"
        
        mask="+998-99-999-99-99"
        class="w-100 border rounded-md px-3 py-2 text-black bg-white "
        :class="{ 'p-invalid': !isValid && required }"
        placeholder="+998-__-___-__-__"
      />
      <label :for="id" class="text-gray-700 bg-white" >{{ title }}</label>
    </FloatLabel>

    <small v-if="required && !isValid" class="text-red-600 text-sm mt-1 block">
      Raqam to‘liq kiritilishi kerak.
    </small>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineEmits } from "vue";
import InputMask from "primevue/inputmask";
import FloatLabel from "primevue/floatlabel";

const props = defineProps<{
  modelValue: string;
  id: string;
  title: string;
  required?: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);

const inputValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit("update:modelValue", val),
});

// Validatsiya: raqamning to‘liq kiritilganligini tekshiradi
const isValid = computed(() => {
  if (!props.required) return true;
  return /^\+998-\d{2}-\d{3}-\d{2}-\d{2}$/.test(props.modelValue);
});
</script>
