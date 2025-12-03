import { defineStore } from "pinia";
import { files } from "@/api"; // ← убедитесь, что путь правильный

export const useFileStore = defineStore("file", {
  state: (): {
    req: Resource | null;
    oldReq: Resource | null;
    reload: boolean;
    selected: number[];
    multiple: boolean;
    isFiles: boolean;
    preselect: string | null;
    sortByCreated: boolean;
  } => ({
    req: null,
    oldReq: null,
    reload: false,
    selected: [],
    multiple: false,
    isFiles: false,
    preselect: null,
    sortByCreated: false,
  }),
  getters: {
    selectedCount: (state) => state.selected.length,
    isListing: (state) => {
      return state.isFiles && state?.req?.isDir;
    },
  },
  actions: {
    async fetch(path: string) {
      try {
        const data = await files.fetch(path);
        this.req = data;
      } catch (error) {
        // Можно пробросить ошибку вверх или обработать здесь
        throw error;
      }
    },

    toggleMultiple() {
      this.multiple = !this.multiple;
    },
    updateRequest(value: Resource | null) {
      const selectedItems = this.selected.map((i) => this.req?.items[i]);
      this.oldReq = this.req;
      this.req = value;
      this.selected = [];

      if (!this.req?.items) return;
      this.selected = this.req.items
        .filter((item) =>
          selectedItems.some((rItem) => rItem?.url === item.url)
        )
        .map((item) => item.index);
    },
    removeSelected(value: any) {
      const i = this.selected.indexOf(value);
      if (i === -1) return;
      this.selected.splice(i, 1);
    },
    toggleSortByCreated() {
      this.sortByCreated = !this.sortByCreated;
      this.selected = [];
    },
    setSortByCreated(value: boolean) {
      this.sortByCreated = value;
    },
    clearFile() {
      this.$reset();
    },
  },
});