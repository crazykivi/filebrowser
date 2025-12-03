<template>
  <div>
    <header-bar showMenu showLogo>
      <search />
      <title />
      <action class="search-button" icon="search" :label="t('buttons.search')" @action="openSearch()" />

      <template #actions>
        <template v-if="!isMobile">
          <action v-if="headerButtons.share" icon="share" :label="t('buttons.share')" show="share" />
          <action v-if="headerButtons.rename" icon="mode_edit" :label="t('buttons.rename')" show="rename" />
          <action v-if="headerButtons.copy" id="copy-button" icon="content_copy" :label="t('buttons.copyFile')"
            show="copy" />
          <action v-if="headerButtons.move" id="move-button" icon="forward" :label="t('buttons.moveFile')"
            show="move" />
          <action v-if="headerButtons.delete" id="delete-button" icon="delete" :label="t('buttons.delete')"
            show="delete" />
          <action v-if="authStore.user?.perm.create && fileStore.selectedCount === 0" icon="add"
            :label="$t('buttons.create')" @click="showCreateModeMenu($event)" />
        </template>

        <action v-if="fileStore.req?.numFiles" icon="calendar_today" :label="t('buttons.sortByDate')"
          @click="toggleSortByCreated" :class="{ active: sortByCreated }" />

        <action v-if="headerButtons.shell" icon="code" :label="t('buttons.shell')" @action="layoutStore.toggleShell" />
        <action :icon="viewIcon" :label="t('buttons.switchView')" @action="switchView" />
        <action v-if="headerButtons.download" icon="file_download" :label="t('buttons.download')" @action="download"
          :counter="fileStore.selectedCount" />
        <action v-if="headerButtons.upload" icon="file_upload" id="upload-button" :label="t('buttons.upload')"
          @action="uploadFunc" />
        <action icon="info" :label="t('buttons.info')" show="info" />
        <action icon="check_circle" :label="t('buttons.selectMultiple')" @action="toggleMultipleSelection" />
      </template>
    </header-bar>

    <div v-if="isMobile" id="file-selection">
      <span v-if="fileStore.selectedCount > 0">
        {{ t("prompts.filesSelected", fileStore.selectedCount) }}
      </span>
      <action v-if="headerButtons.share" icon="share" :label="t('buttons.share')" show="share" />
      <action v-if="headerButtons.rename" icon="mode_edit" :label="t('buttons.rename')" show="rename" />
      <action v-if="headerButtons.copy" icon="content_copy" :label="t('buttons.copyFile')" show="copy" />
      <action v-if="headerButtons.move" icon="forward" :label="t('buttons.moveFile')" show="move" />
      <action v-if="headerButtons.delete" icon="delete" :label="t('buttons.delete')" show="delete" />
    </div>

    <div v-if="layoutStore.loading">
      <h2 class="message delayed">
        <div class="spinner">
          <div class="bounce1"></div>
          <div class="bounce2"></div>
          <div class="bounce3"></div>
        </div>
        <span>{{ t("files.loading") }}</span>
      </h2>
    </div>
    <template v-else>
      <div v-if="(fileStore.req?.numDirs ?? 0) + (fileStore.req?.numFiles ?? 0) == 0">
        <h2 class="message">
          <i class="material-icons">sentiment_dissatisfied</i>
          <span>{{ t("files.lonely") }}</span>
        </h2>
        <input style="display: none" type="file" id="upload-input" @change="uploadInput($event)" multiple />
        <input style="display: none" type="file" id="upload-folder-input" @change="uploadInput($event)" webkitdirectory
          multiple />
      </div>
      <div v-else id="listing" ref="listing" class="file-icons" :class="authStore.user?.viewMode ?? ''">
        <div>
          <div class="item header">
            <div>
              <p :class="{ active: nameSorted }" class="name" role="button" tabindex="0" @click="sort('name')"
                :title="t('files.sortByName')" :aria-label="t('files.sortByName')">
                <span>{{ t("files.name") }}</span>
                <i class="material-icons">{{ nameIcon }}</i>
              </p>

              <p :class="{ active: sizeSorted }" class="size" role="button" tabindex="0" @click="sort('size')"
                :title="t('files.sortBySize')" :aria-label="t('files.sortBySize')">
                <span>{{ t("files.size") }}</span>
                <i class="material-icons">{{ sizeIcon }}</i>
              </p>
              <p :class="{ active: modifiedSorted }" class="modified" role="button" tabindex="0"
                @click="sort('modified')" :title="t('files.sortByLastModified')"
                :aria-label="t('files.sortByLastModified')">
                <span>{{ t("files.lastModified") }}</span>
                <i class="material-icons">{{ modifiedIcon }}</i>
              </p>
            </div>
          </div>
        </div>

        <!-- <div v-if="sortByCreated && groupedFileGroups.length > 0">
          <div v-for="group in groupedFileGroups" :key="group.title" class="date-group-container">
            <h2 class="date-group">{{ group.title }}</h2>
            <div @contextmenu="showContextMenu">
              <item v-for="item in group.items" :key="base64(item.name)" :index="item.index" :name="item.name"
                :isDir="item.isDir" :url="item.url" :modified="item.modified" :type="item.type" :size="item.size"
                :path="item.path" />
            </div>
          </div>
        </div> -->
        <!-- <div v-if="sortByCreated && groupedFileGroups.length > 0">
          <div v-for="group in groupedFileGroups" :key="group.title" class="date-group-container">
            <div class="group-wrapper">
              <h2 class="date-group">{{ group.title }}</h2>
              <div @contextmenu="showContextMenu" class="group-items">
                <item v-for="item in group.items" :key="base64(item.name)" :index="item.index" :name="item.name"
                  :isDir="item.isDir" :url="item.url" :modified="item.modified" :type="item.type" :size="item.size"
                  :path="item.path" />
              </div>
            </div>
          </div>
        </div> -->
        <!-- Grouping mode by creation date | Режим группировки по дате создания -->
        <div v-if="sortByCreated && groupedFileGroups.length > 0">
          <!-- <div v-for="group in groupedFileGroups" :key="group.title" class="date-group-section"> -->
          <div v-for="group in groupedFileGroups" :key="group.title" class="date-group-section"
            :class="authStore.user?.viewMode ? `viewmode--${authStore.user.viewMode.replace(' ', '-')}` : ''">
            <div class="group-header">
              <h2>{{ group.title }}</h2>
            </div>
            <div @contextmenu="showContextMenu" class="group-items">
              <item v-for="item in group.items" :key="base64(item.name)" :index="item.index" :name="item.name"
                :isDir="item.isDir" :url="item.url" :modified="item.modified" :type="item.type" :size="item.size"
                :path="item.path" />
            </div>
          </div>
        </div>

        <!-- Normal mode (when sorting by date is not enabled) | Обычный режим (когда не включена сортировка по дате) -->
        <template v-else>
          <h2 v-if="fileStore.req?.numDirs ?? false">
            {{ t("files.folders") }}
          </h2>
          <div v-if="fileStore.req?.numDirs ?? false" @contextmenu="showContextMenu">
            <item v-for="item in dirs" :key="base64(item.name)" v-bind:index="item.index" v-bind:name="item.name"
              v-bind:isDir="item.isDir" v-bind:url="item.url" v-bind:modified="item.modified" v-bind:type="item.type"
              v-bind:size="item.size" v-bind:path="item.path">
            </item>
          </div>

          <h2 v-if="fileStore.req?.numFiles ?? false">
            {{ t("files.files") }}
          </h2>
          <div v-if="fileStore.req?.numFiles ?? false" @contextmenu="showContextMenu">
            <item v-for="item in files" :key="base64(item.name)" v-bind:index="item.index" v-bind:name="item.name"
              v-bind:isDir="item.isDir" v-bind:url="item.url" v-bind:modified="item.modified" v-bind:type="item.type"
              v-bind:size="item.size" v-bind:path="item.path">
            </item>
          </div>
        </template>

        <context-menu :show="isContextMenuVisible" :pos="contextMenuPos" @hide="hideContextMenu">
          <action v-if="headerButtons.share" icon="share" :label="t('buttons.share')" show="share" />
          <action v-if="headerButtons.rename" icon="mode_edit" :label="t('buttons.rename')" show="rename" />
          <action v-if="headerButtons.copy" id="copy-button" icon="content_copy" :label="t('buttons.copyFile')"
            show="copy" />
          <action v-if="headerButtons.move" id="move-button" icon="forward" :label="t('buttons.moveFile')"
            show="move" />
          <action v-if="headerButtons.delete" id="delete-button" icon="delete" :label="t('buttons.delete')"
            show="delete" />
          <action v-if="headerButtons.download" icon="file_download" :label="t('buttons.download')" @action="download"
            :counter="fileStore.selectedCount" />
          <action icon="add" :label="$t('buttons.create')" @click="showCreateModeMenu" />
          <action icon="info" :label="t('buttons.info')" show="info" />
        </context-menu>
        <context-menu :show="isCreateMenuVisible" :pos="createMenuPos" @hide="hideCreateMenu">
          <action icon="create_new_folder" :label="$t('sidebar.newFolder')" @action="createNewFolder" />
          <action icon="note_add" :label="$t('sidebar.newFile')" @action="createNewFile" />
        </context-menu>

        <input style="display: none" type="file" id="upload-input" @change="uploadInput($event)" multiple />
        <input style="display: none" type="file" id="upload-folder-input" @change="uploadInput($event)" webkitdirectory
          multiple />

        <div :class="{ active: fileStore.multiple }" id="multiple-selection">
          <p>{{ t("files.multipleSelectionEnabled") }}</p>
          <div @click="() => (fileStore.multiple = false)" tabindex="0" role="button" :title="t('buttons.clear')"
            :aria-label="t('buttons.clear')" class="action">
            <i class="material-icons">clear</i>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useClipboardStore } from "@/stores/clipboard";
import { useFileStore } from "@/stores/file";
import { useLayoutStore } from "@/stores/layout";

import { users, files as api } from "@/api";
import { enableExec } from "@/utils/constants";
import * as upload from "@/utils/upload";
import css from "@/utils/css";
import { throttle } from "lodash-es";
import { Base64 } from "js-base64";

import HeaderBar from "@/components/header/HeaderBar.vue";
import Action from "@/components/header/Action.vue";
import Search from "@/components/Search.vue";
import Item from "@/components/files/ListingItem.vue";
import ContextMenu from "@/components/ContextMenu.vue";
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { removePrefix } from "@/api/utils";

import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

// const sortByCreated = ref(false);
const sortByCreated = computed(() => fileStore.sortByCreated);

const showLimit = ref<number>(50);
const columnWidth = ref<number>(280);
const dragCounter = ref<number>(0);
const width = ref<number>(window.innerWidth);
const itemWeight = ref<number>(0);
const isContextMenuVisible = ref<boolean>(false);
const contextMenuPos = ref<{ x: number; y: number }>({ x: 0, y: 0 });

const $showError = inject<IToastError>("$showError")!;

const clipboardStore = useClipboardStore();
const authStore = useAuthStore();
const fileStore = useFileStore();
const layoutStore = useLayoutStore();

const { req } = storeToRefs(fileStore);

const route = useRoute();

const { t } = useI18n();

const listing = ref<HTMLElement | null>(null);

// File grouping function by month/year | функция группировки файлов по месяцу/году
function groupByMonthYear(items: ResourceItem[]) {
  const groups: { [key: string]: ResourceItem[] } = {};

  items.forEach(item => {
    const date = parseISO(item.modified); // always modified | всегда modified
    const key = format(date, 'LLLL yyyy', { locale: ru });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    const dateA = new Date(parseInt(yearA), getMonthIndex(monthA));
    const dateB = new Date(parseInt(yearB), getMonthIndex(monthB));
    return dateB.getTime() - dateA.getTime();
  });

  return sortedKeys.map(key => ({ title: key, items: groups[key] }));
}

// Helper function: month name -> index (0–11) | Вспомогательная функция: название месяца -> индекс (0–11)
function getMonthIndex(monthName: string): number {
  const months = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  return months.findIndex(m => m.startsWith(monthName.toLowerCase()));
}

// Computed property for file groups | вычисляемое свойство для групп файлов
const groupedFileGroups = computed(() => {
  if (!sortByCreated.value || !fileStore.req) return [];

  const allFiles = fileStore.req.items.filter(item => !item.isDir);
  const sortedFiles = [...allFiles].sort((a, b) => {
    const dateA = new Date(a.modified).getTime(); // only modified |только modified
    const dateB = new Date(b.modified).getTime();
    return dateB - dateA;
  });

  return groupByMonthYear(sortedFiles);
});

const nameSorted = computed(() =>
  fileStore.req ? fileStore.req.sorting.by === "name" : false
);

const sizeSorted = computed(() =>
  fileStore.req ? fileStore.req.sorting.by === "size" : false
);

const modifiedSorted = computed(() =>
  fileStore.req ? fileStore.req.sorting.by === "modified" : false
);

const ascOrdered = computed(() =>
  fileStore.req ? fileStore.req.sorting.asc : false
);

const dirs = computed(() => items.value.dirs.slice(0, showLimit.value));

const items = computed(() => {
  const dirs: any[] = [];
  const files: any[] = [];

  fileStore.req?.items.forEach((item) => {
    if (item.isDir) {
      dirs.push(item);
    } else {
      files.push(item);
    }
  });

  return { dirs, files };
});

const files = computed((): Resource[] => {
  let _showLimit = showLimit.value - items.value.dirs.length;

  if (_showLimit < 0) _showLimit = 0;

  return items.value.files.slice(0, _showLimit);
});

const nameIcon = computed(() => {
  if (nameSorted.value && !ascOrdered.value) {
    return "arrow_upward";
  }

  return "arrow_downward";
});

const sizeIcon = computed(() => {
  if (sizeSorted.value && ascOrdered.value) {
    return "arrow_downward";
  }

  return "arrow_upward";
});

const modifiedIcon = computed(() => {
  if (modifiedSorted.value && ascOrdered.value) {
    return "arrow_downward";
  }

  return "arrow_upward";
});

const viewIcon = computed(() => {
  const icons = {
    list: "view_module",
    mosaic: "grid_view",
    "mosaic gallery": "view_list",
  };
  return authStore.user === null
    ? icons["list"]
    : icons[authStore.user.viewMode];
});

const headerButtons = computed(() => {
  return {
    upload: authStore.user?.perm.create,
    download: authStore.user?.perm.download,
    shell: authStore.user?.perm.execute && enableExec,
    delete: fileStore.selectedCount > 0 && authStore.user?.perm.delete,
    rename: fileStore.selectedCount === 1 && authStore.user?.perm.rename,
    share: fileStore.selectedCount === 1 && authStore.user?.perm.share,
    move: fileStore.selectedCount > 0 && authStore.user?.perm.rename,
    copy: fileStore.selectedCount > 0 && authStore.user?.perm.create,
  };
});

const isMobile = computed(() => {
  return width.value <= 736;
});

// mode switching method | метод переключения режима
const toggleSortByCreated = () => {
  fileStore.toggleSortByCreated();
};

// watch(req, () => {
//   // Reset the show value
//   showLimit.value = 50;

//   nextTick(() => {
//     // Ensures that the listing is displayed
//     // How much every listing item affects the window height
//     setItemWeight();

//     // Scroll to the item opened previously
//     if (!revealPreviousItem()) {
//       // Fill and fit the window with listing items
//       fillWindow(true);
//     }
//   });
// });
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (oldPath !== newPath && oldPath.startsWith(newPath)) {
      const saved = sessionStorage.getItem('filePreselect');
      if (saved) {
        fileStore.preselect = saved;
        nextTick(() => {
          setTimeout(() => {
            revealPreviousItem();
          }, 100);
        });
      }
    }
  }
);

onMounted(() => {
  if (!fileStore.preselect) {
    const saved = sessionStorage.getItem('filePreselect');
    if (saved) {
      fileStore.preselect = saved;
    }
  }
  // Check the columns size for the first time.
  columnsResize();

  // How much every listing item affects the window height
  setItemWeight();

  // Scroll to the item opened previously
  if (!revealPreviousItem()) {
    // Fill and fit the window with listing items
    fillWindow(true);
  }

  // Add the needed event listeners to the window and document.
  window.addEventListener("keydown", keyEvent);
  window.addEventListener("scroll", scrollEvent);
  window.addEventListener("resize", windowsResize);

  if (!authStore.user?.perm.create) return;
  document.addEventListener("dragover", preventDefault);
  document.addEventListener("dragenter", dragEnter);
  document.addEventListener("dragleave", dragLeave);
  document.addEventListener("drop", drop);
});

onBeforeUnmount(() => {
  // Remove event listeners before destroying this page.
  window.removeEventListener("keydown", keyEvent);
  window.removeEventListener("scroll", scrollEvent);
  window.removeEventListener("resize", windowsResize);

  if (authStore.user && !authStore.user?.perm.create) return;
  document.removeEventListener("dragover", preventDefault);
  document.removeEventListener("dragenter", dragEnter);
  document.removeEventListener("dragleave", dragLeave);
  document.removeEventListener("drop", drop);
});

const base64 = (name: string) => Base64.encodeURI(name);

const keyEvent = (event: KeyboardEvent) => {
  // No prompts are shown
  if (layoutStore.currentPrompt !== null) {
    return;
  }

  if (event.key === "Escape") {
    // Reset files selection.
    fileStore.selected = [];
  }

  if (event.key === "Delete") {
    if (!authStore.user?.perm.delete || fileStore.selectedCount == 0) return;

    // Show delete prompt.
    layoutStore.showHover("delete");
  }

  if (event.key === "F2") {
    if (!authStore.user?.perm.rename || fileStore.selectedCount !== 1) return;

    // Show rename prompt.
    layoutStore.showHover("rename");
  }

  // Ctrl is pressed
  if (!event.ctrlKey && !event.metaKey) {
    return;
  }

  switch (event.key) {
    case "f":
    case "F":
      if (event.shiftKey) {
        event.preventDefault();
        layoutStore.showHover("search");
      }
      break;
    case "c":
    case "x":
      copyCut(event);
      break;
    case "v":
      paste(event);
      break;
    case "a":
      event.preventDefault();
      for (const file of items.value.files) {
        if (fileStore.selected.indexOf(file.index) === -1) {
          fileStore.selected.push(file.index);
        }
      }
      for (const dir of items.value.dirs) {
        if (fileStore.selected.indexOf(dir.index) === -1) {
          fileStore.selected.push(dir.index);
        }
      }
      break;
    case "s":
      event.preventDefault();
      document.getElementById("download-button")?.click();
      break;
  }
};

const preventDefault = (event: Event) => {
  // Wrapper around prevent default.
  event.preventDefault();
};

const copyCut = (event: Event | KeyboardEvent): void => {
  if ((event.target as HTMLElement).tagName?.toLowerCase() === "input") return;

  if (fileStore.req === null) return;

  const items = [];

  for (const i of fileStore.selected) {
    items.push({
      from: fileStore.req.items[i].url,
      name: fileStore.req.items[i].name,
    });
  }

  if (items.length === 0) {
    return;
  }

  clipboardStore.$patch({
    key: (event as KeyboardEvent).key,
    items,
    path: route.path,
  });
};

const paste = (event: Event) => {
  if ((event.target as HTMLElement).tagName?.toLowerCase() === "input") return;

  // TODO router location should it be
  const items: any[] = [];

  for (const item of clipboardStore.items) {
    const from = item.from.endsWith("/") ? item.from.slice(0, -1) : item.from;
    const to = route.path + encodeURIComponent(item.name);
    items.push({ from, to, name: item.name });
  }

  if (items.length === 0) {
    return;
  }

  const preselect = removePrefix(route.path) + items[0].name;

  let action = (overwrite: boolean, rename: boolean) => {
    api
      .copy(items, overwrite, rename)
      .then(() => {
        fileStore.preselect = preselect;
        fileStore.reload = true;
      })
      .catch($showError);
  };

  if (clipboardStore.key === "x") {
    action = (overwrite, rename) => {
      api
        .move(items, overwrite, rename)
        .then(() => {
          clipboardStore.resetClipboard();
          fileStore.preselect = preselect;
          fileStore.reload = true;
        })
        .catch($showError);
    };
  }

  if (clipboardStore.path == route.path) {
    action(false, true);

    return;
  }

  const conflict = upload.checkConflict(items, fileStore.req!.items);

  let overwrite = false;
  let rename = false;

  if (conflict) {
    layoutStore.showHover({
      prompt: "replace-rename",
      confirm: (event: Event, option: string) => {
        overwrite = option == "overwrite";
        rename = option == "rename";

        event.preventDefault();
        layoutStore.closeHovers();
        action(overwrite, rename);
      },
    });

    return;
  }

  action(overwrite, rename);
};

const columnsResize = () => {
  // Update the columns size based on the window width.
  const items_ = css(["#listing.mosaic .item", ".mosaic#listing .item", ".date-group-section.viewmode--mosaic .item", ".date-group-section.viewmode--mosaic-gallery .item"]);
  if (items_ === null) return;

  let columns = Math.floor(
    (document.querySelector("main")?.offsetWidth ?? 0) / columnWidth.value
  );
  if (columns === 0) columns = 1;
  items_.style.width = `calc(${100 / columns}% - 1em)`;
};

const scrollEvent = throttle(() => {
  const totalItems =
    (fileStore.req?.numDirs ?? 0) + (fileStore.req?.numFiles ?? 0);

  // All items are displayed
  if (showLimit.value >= totalItems) return;

  const currentPos = window.innerHeight + window.scrollY;

  // Trigger at the 75% of the window height
  const triggerPos = document.body.offsetHeight - window.innerHeight * 0.25;

  if (currentPos > triggerPos) {
    // Quantity of items needed to fill 2x of the window height
    const showQuantity = Math.ceil((window.innerHeight * 2) / itemWeight.value);

    // Increase the number of displayed items
    showLimit.value += showQuantity;
  }
}, 100);

const dragEnter = () => {
  dragCounter.value++;

  // When the user starts dragging an item, put every
  // file on the listing with 50% opacity.
  const items = document.getElementsByClassName("item");

  Array.from(items).forEach((file: Element) => {
    (file as HTMLElement).style.opacity = "0.5";
  });
};

const dragLeave = () => {
  dragCounter.value--;

  if (dragCounter.value == 0) {
    resetOpacity();
  }
};

const drop = async (event: DragEvent) => {
  event.preventDefault();
  dragCounter.value = 0;
  resetOpacity();

  const dt = event.dataTransfer;
  let el: HTMLElement | null = event.target as HTMLElement;

  if (fileStore.req === null || dt === null || dt.files.length <= 0) return;

  for (let i = 0; i < 5; i++) {
    if (el !== null && !el.classList.contains("item")) {
      el = el.parentElement;
    }
  }

  const files: UploadList = (await upload.scanFiles(dt)) as UploadList;
  let items = fileStore.req.items;
  let path = route.path.endsWith("/") ? route.path : route.path + "/";

  if (
    el !== null &&
    el.classList.contains("item") &&
    el.dataset.dir === "true"
  ) {
    // Get url from ListingItem instance
    // TODO: Don't know what is happening here
    path = el.__vue__.url;

    try {
      items = (await api.fetch(path)).items;
    } catch (error: any) {
      $showError(error);
    }
  }

  const conflict = upload.checkConflict(files, items);

  const preselect = removePrefix(path) + (files[0].fullPath || files[0].name);

  if (conflict) {
    layoutStore.showHover({
      prompt: "replace",
      action: (event: Event) => {
        event.preventDefault();
        layoutStore.closeHovers();
        upload.handleFiles(files, path, false);
        fileStore.preselect = preselect;
      },
      confirm: (event: Event) => {
        event.preventDefault();
        layoutStore.closeHovers();
        upload.handleFiles(files, path, true);
        fileStore.preselect = preselect;
      },
    });

    return;
  }

  upload.handleFiles(files, path);
  fileStore.preselect = preselect;
};

const uploadInput = async (event: Event) => {
  const files = (event.currentTarget as HTMLInputElement)?.files;
  if (files === null) return;

  const folder_upload = !!files[0].webkitRelativePath;

  const uploadFiles: UploadList = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = folder_upload ? file.webkitRelativePath : undefined;
    uploadFiles.push({
      file,
      name: file.name,
      size: file.size,
      isDir: false,
      fullPath,
    });
  }

  const path = route.path.endsWith("/") ? route.path : route.path + "/";
  const conflict = upload.checkConflict(uploadFiles, fileStore.req!.items);

  // const doUpload = async (overwrite: boolean) => {
  //   try {
  //     await upload.handleFiles(uploadFiles, path, overwrite);
  //     // await fileStore.fetch();
  //     const route = useRoute();
  //     await fileStore.fetch(route.path);
  //   } catch (err) {
  //     $showError(err instanceof Error ? err : String(err));
  //   }
  // };
  const doUpload = async (overwrite: boolean) => {
  let filesToUpload = uploadFiles;
  if (!overwrite) {
    const existingNames = new Set(fileStore.req!.items.map(i => i.name));
    filesToUpload = uploadFiles.filter(f => !existingNames.has(
      f.fullPath ? f.fullPath.split('/')[0] : f.name
    ));
    if (filesToUpload.length === 0) {
      layoutStore.closeHovers();
      return;
    }
  }

  try {
    await upload.handleFiles(filesToUpload, path, overwrite);
    await new Promise(resolve => setTimeout(resolve, 300));
    await fileStore.fetch(route.path);
    layoutStore.closeHovers();
  } catch (err) {
    $showError(err instanceof Error ? err : String(err));
  }
};

  if (conflict) {
    layoutStore.showHover({
      prompt: "replace",
      action: (event: Event) => {
        event.preventDefault();
        layoutStore.closeHovers();
        // upload.handleFiles(uploadFiles, path, false);
        doUpload(false);
      },
      confirm: (event: Event) => {
        event.preventDefault();
        layoutStore.closeHovers();
        // upload.handleFiles(uploadFiles, path, true);
        doUpload(false);
      },
    });

    return;
  }

  // upload.handleFiles(uploadFiles, path);
  await doUpload(false);
};

const resetOpacity = () => {
  const items = document.getElementsByClassName("item");

  Array.from(items).forEach((file: Element) => {
    (file as HTMLElement).style.opacity = "1";
  });
};

const sort = async (by: string) => {
  let asc = false;

  if (by === "name") {
    if (nameIcon.value === "arrow_upward") {
      asc = true;
    }
  } else if (by === "size") {
    if (sizeIcon.value === "arrow_upward") {
      asc = true;
    }
  } else if (by === "modified") {
    if (modifiedIcon.value === "arrow_upward") {
      asc = true;
    }
  }

  try {
    if (authStore.user?.id) {
      await users.update({ id: authStore.user?.id, sorting: { by, asc } }, [
        "sorting",
      ]);
    }
  } catch (e: any) {
    $showError(e);
  }

  fileStore.reload = true;
};

const openSearch = () => {
  layoutStore.showHover("search");
};

const toggleMultipleSelection = () => {
  fileStore.toggleMultiple();
  layoutStore.closeHovers();
};

const windowsResize = throttle(() => {
  columnsResize();
  width.value = window.innerWidth;

  // Listing element is not displayed
  if (listing.value == null) return;

  // How much every listing item affects the window height
  setItemWeight();

  // Fill but not fit the window
  fillWindow();
}, 100);

const download = () => {
  if (fileStore.req === null) return;

  if (
    fileStore.selectedCount === 1 &&
    !fileStore.req.items[fileStore.selected[0]].isDir
  ) {
    api.download(null, fileStore.req.items[fileStore.selected[0]].url);
    return;
  }

  layoutStore.showHover({
    prompt: "download",
    confirm: (format: any) => {
      layoutStore.closeHovers();

      const files = [];

      if (fileStore.selectedCount > 0 && fileStore.req !== null) {
        for (const i of fileStore.selected) {
          files.push(fileStore.req.items[i].url);
        }
      } else {
        files.push(route.path);
      }

      api.download(format, ...files);
    },
  });
};

const switchView = async () => {
  layoutStore.closeHovers();

  const modes = {
    list: "mosaic",
    mosaic: "mosaic gallery",
    "mosaic gallery": "list",
  };

  const data = {
    id: authStore.user?.id,
    viewMode: (modes[authStore.user?.viewMode ?? "list"] ||
      "list") as ViewModeType,
  };

  users.update(data, ["viewMode"]).catch($showError);

  authStore.updateUser(data);

  setItemWeight();
  fillWindow();
};

const uploadFunc = () => {
  if (
    typeof window.DataTransferItem !== "undefined" &&
    typeof DataTransferItem.prototype.webkitGetAsEntry !== "undefined"
  ) {
    layoutStore.showHover("upload");
  } else {
    document.getElementById("upload-input")?.click();
  }
};

const setItemWeight = () => {
  // Listing element is not displayed
  if (listing.value === null || fileStore.req === null) return;

  let itemQuantity = fileStore.req.numDirs + fileStore.req.numFiles;
  if (itemQuantity > showLimit.value) itemQuantity = showLimit.value;

  // How much every listing item affects the window height
  itemWeight.value = listing.value.offsetHeight / itemQuantity;
};

const fillWindow = (fit = false) => {
  if (fileStore.req === null) return;

  const totalItems = fileStore.req.numDirs + fileStore.req.numFiles;

  // More items are displayed than the total
  if (showLimit.value >= totalItems && !fit) return;

  const windowHeight = window.innerHeight;

  // Quantity of items needed to fill 2x of the window height
  const showQuantity = Math.ceil(
    (windowHeight + windowHeight * 2) / itemWeight.value
  );

  // Less items to display than current
  if (showLimit.value > showQuantity && !fit) return;

  // Set the number of displayed items
  showLimit.value = showQuantity > totalItems ? totalItems : showQuantity;
};

// const revealPreviousItem = () => {
//   if (!fileStore.req || !fileStore.oldReq) return;

//   const index = fileStore.selected[0];
//   if (index === undefined) return;

//   showLimit.value =
//     index + Math.ceil((window.innerHeight * 2) / itemWeight.value);

//   nextTick(() => {
//     const items = document.querySelectorAll("#listing .item");
//     items[index].scrollIntoView({ block: "center" });
//   });

//   return true;
// };
const revealPreviousItem = () => {
  // if (!fileStore.preselect) {
  //   console.groupEnd();
  //   return false;
  // }
  const url = fileStore.preselect;
  if (!url) {
    console.groupEnd();
    return false;
  }

  // Waiting for the next tick to allow the DOM to finish rendering | Ожидание следующего тика, чтобы DOM успел отрисоваться
  nextTick(() => {
    const selector = `#listing .item[data-url="${CSS.escape(url)}"]`;
    // const selector = `#listing .item[data-url="${CSS.escape(fileStore.preselect)}"]`;

    const target = document.querySelector(selector) as HTMLElement | null;

    if (target) {
      // Scrolling to the element | Прокрутка к элементу
      target.scrollIntoView({ block: "center", behavior: "instant" });

      // Clearing | Очистка
      fileStore.preselect = null;
      sessionStorage.removeItem('filePreselect');
      target.scrollIntoView({ block: "center", behavior: "instant" });
    }
    console.groupEnd();
  });

  return true;
};

const closeAllMenus = () => {
  isContextMenuVisible.value = false;
  isCreateMenuVisible.value = false;
};

const showContextMenu = (event: MouseEvent) => {
  closeAllMenus();
  event.preventDefault();
  isContextMenuVisible.value = true;
  // contextMenuPos.value = {
  //   x: event.clientX + 8,
  //   y: event.clientY + Math.floor(window.scrollY),
  // };
  const menuWidth = 200;
  const menuHeight = 150;

  let x = event.clientX + 8;
  let y = event.clientY + window.scrollY;

  // Horizontally | По горизонтали
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 5;
  }

  // Vertically | По вертикали
  if (y + menuHeight > window.innerHeight + window.scrollY) {
    y = event.clientY + window.scrollY - menuHeight;
  }

  isContextMenuVisible.value = true;
  contextMenuPos.value = { x, y };
};

const hideContextMenu = () => {
  isContextMenuVisible.value = false;
};

const createMenuPos = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const isCreateMenuVisible = ref<boolean>(false);

const showCreateModeMenu = (event?: MouseEvent) => {
  isCreateMenuVisible.value = true;
  if (isContextMenuVisible.value) {
    const menuWidth = 200;
    const menuHeight = 150;
    let x = contextMenuPos.value.x;
    let y = contextMenuPos.value.y;
    let newX = x + 219;
    let newY = y;
    if (newX + menuWidth > window.innerWidth) newX = x - menuWidth - 19;
    createMenuPos.value = { x: newX, y: newY };
  } else {
    if (event) {
      const menuWidth = 200;
      const menuHeight = 150;
      let x = event.clientX;
      let y = event.clientY + window.scrollY;
      let newX = x;
      let newY = y;
      if (newX + menuWidth > window.innerWidth) newX = x - menuWidth - 10;
      if (newY + menuHeight > window.innerHeight + window.scrollY) newY = y - menuHeight - 100;
      createMenuPos.value = { x: newX, y: newY };
      event.preventDefault();
    } else {
      createMenuPos.value = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
  }
};

const hideCreateMenu = () => {
  isCreateMenuVisible.value = false;
};

const createNewFolder = () => {
  closeAllMenus();
  layoutStore.showHover({
    prompt: "newDir",
  });
};

const createNewFile = () => {
  closeAllMenus();
  layoutStore.showHover({
    prompt: "newFile",
  });
};
</script>

<style scoped>
.date-group {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
  padding-left: 8px;
  font-size: 1.1rem;
}

.group-header {
  display: block;
  width: 100%;
  /* margin-bottom: 0.5rem; */
  padding-left: 8px;
  font-weight: 600;
  color: #555;
  font-size: 1.1rem;
}

.mosaic .group-header {
  clear: both;
  display: block !important;
  width: 100% !important;
  margin: 0.5rem 0 0.5rem 0 !important;
  padding: 0.5rem 0 0.5rem 8px !important;
  /* background: #f8f9fa; */
  border-radius: 4px;
}

.mosaic .group-header+.group-items .item:first-child {
  margin-top: 0;
}

/* For the gallery | Для галереи */
.date-group-section.viewmode--list {
  width: 100%;
}

.date-group-section {
  width: 100%;
}

.date-group-section.viewmode--mosaic {
  width: 100%;
}

.date-group-section.viewmode--mosaic .group-items,
.date-group-section.viewmode--mosaic-gallery .group-items {
  display: flex;
  flex-wrap: wrap;
}
</style>