<template>
  <div
    class="context-menu"
    ref="contextMenu"
    v-show="show"
    :style="{
      top: `${props.pos.y}px`,
      left: `${left}px`,
    }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted, onMounted } from "vue";

const emit = defineEmits(["hide"]);
const props = defineProps<{ show: boolean; pos: { x: number; y: number } }>();
const contextMenu = ref<HTMLElement | null>(null);

// Menu dimensions that will be updated when `show` changes | Размеры меню, которые будут обновляться при изменении show
const menuWidth = ref(0);
const menuHeight = ref(0);

onMounted(() => {
  if (contextMenu.value) {
    menuWidth.value = contextMenu.value.offsetWidth;
    menuHeight.value = contextMenu.value.offsetHeight;
  }
});

watch(
  () => props.show,
  (val) => {
    if (val && contextMenu.value) {
      // Обновляем размеры при открытии
      menuWidth.value = contextMenu.value.offsetWidth;
      menuHeight.value = contextMenu.value.offsetHeight;
    }
  }
);

const left = computed(() => {
  return Math.min(
    props.pos.x,
    // window.innerWidth - (contextMenu.value?.clientWidth ?? 0)
    window.innerWidth - menuWidth.value
  );
});

// const hideContextMenu = () => {
//   emit("hide");
// };

// watch(
//   () => props.show,
//   (val) => {
//     if (val) {
//       document.addEventListener("click", hideContextMenu);
//     } else {
//       document.removeEventListener("click", hideContextMenu);
//     }
//   }
// );

// onUnmounted(() => {
//   document.removeEventListener("click", hideContextMenu);
// });
const handleClickOutside = (event: MouseEvent) => {
  // If the menu is not displayed, then do nothing | Если меню не отображается, то ничего
  if (!props.show) return;

  // If the click occurred inside this menu, ignore closing the menu | Если клик произошел внутри этого меню, то игнорирование закрытия меню
  if (contextMenu.value && contextMenu.value.contains(event.target as Node)) {
    return;
  }

  // If all the above checks pass, hide the menu | Если прошло все проверки выше, то скрывает меню
  emit("hide");
};

watch(
  () => props.show,
  (val) => {
    if (val) {
      // The handler includes a small delay to avoid capturing the click that opened the menu | В обработчике небольшая задержка, чтобы не поймать клик, который открыл меню
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
  }
);

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
