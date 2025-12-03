<template>
  <div class="card floating">
    <div class="card-title">
      <h2>{{ t("prompts.upload") }}</h2>
    </div>

    <div class="card-content">
      <p>{{ t("prompts.uploadMessage") }}</p>
    </div>

    <div class="card-action full">
      <div
        @click="uploadFile"
        @keypress.enter="uploadFile"
        class="action"
        id="focus-prompt"
        tabindex="1"
      >
        <i class="material-icons">insert_drive_file</i>
        <div class="title">{{ t("buttons.file") }}</div>
      </div>
      <div
        @click="uploadFolder"
        @keypress.enter="uploadFolder"
        class="action"
        tabindex="2"
      >
        <i class="material-icons">folder</i>
        <div class="title">{{ t("buttons.folder") }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useFileStore } from "@/stores/file";
import { useLayoutStore } from "@/stores/layout";
import { inject } from "vue"; 

import * as upload from "@/utils/upload";

const { t } = useI18n();
const route = useRoute();

const fileStore = useFileStore();
const layoutStore = useLayoutStore();

const $showError = inject<IToastError>("$showError")!;

// TODO: this is a copy of the same function in FileListing.vue
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
  //     const route = useRoute(); 
  //     // await fileStore.fetch();
  //     await fileStore.fetch(route.path);
  //     layoutStore.closeHovers();
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
        doUpload(true);
      },
    });

    return;
  }

  // upload.handleFiles(uploadFiles, path);
  await doUpload(false);
};

const openUpload = (isFolder: boolean) => {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.webkitdirectory = isFolder;
  // TODO: call the function in FileListing.vue instead
  input.onchange = uploadInput;
  input.click();
};

const uploadFile = () => {
  openUpload(false);
};
const uploadFolder = () => {
  openUpload(true);
};
</script>
