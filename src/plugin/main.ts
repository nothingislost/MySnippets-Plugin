import {
  Menu,
  Plugin,
  setIcon,
  ToggleComponent,
  MenuItem,
  ButtonComponent,
} from "obsidian";

import { setAttributes } from "src/util/setAttributes";

import open from "open";

import { addIcons } from "src/icons/customIcons";
import { MySnippetsSettingTab } from "src/settings/settingsTab";
import {
  MySnippetsSettings,
  DEFAULT_SETTINGS,
} from "src/settings/settingsData";

export default class MySnippets extends Plugin {
  settings: MySnippetsSettings;
  statusBarIcon: HTMLElement;

  async onload() {
    console.log("MySnippets v" + this.manifest.version + " loaded");
    addIcons();
    await this.loadSettings();
    this.addSettingTab(new MySnippetsSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(() => {
      setTimeout(() => {
        this.setupSnippetsStatusBarIcon();
      });
    });
  }

  setupSnippetsStatusBarIcon() {
    this.statusBarIcon = this.addStatusBarItem();
    this.statusBarIcon.addClass("MiniSettings-statusbar-button");
    this.statusBarIcon.addClass("mod-clickable");

    setAttributes(this.statusBarIcon, {
      "aria-label": "Configure Snippets",
      "aria-label-position": "top",
    });
    setIcon(this.statusBarIcon, "pantone-line");

    this.registerDomEvent(this.statusBarIcon, "click", () => {
      const statusBarRect =
        this.statusBarIcon.parentElement.getBoundingClientRect();
      const statusBarIconRect = this.statusBarIcon.getBoundingClientRect();

      const menu = new Menu(this.app).addItem((item) => {
        item.setTitle("Snippets");

        const itemDom = (item as any).dom as HTMLElement;
        itemDom.setAttribute("style", "display: none;");
      });

      const menuDom = (menu as any).dom as HTMLElement;
      menuDom.addClass("MySnippets-statusbar-menu");

      if (this.settings.aestheticStyle) {
        menuDom.setAttribute(
          "style",
          "background-color: transparent; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);"
        );
      }

      //@ts-ignore
      const vaultPath = this.app.vault.adapter.getBasePath();
      const customCss = (this.app as any).customCss;
      const currentSnippets = customCss.snippets;
      const snippetsFolder = customCss.getSnippetsFolder();
      currentSnippets.forEach((snippet: string) => {
        const snippetPath = customCss.getSnippetPath(snippet);
        const snippetElement = new MenuItem(menu);
        snippetElement.setTitle(snippet);

        const snippetElementDom = (snippetElement as any).dom as HTMLElement;
        const toggleComponent = new ToggleComponent(snippetElementDom);
        const buttonComponent = new ButtonComponent(snippetElementDom);

        function changeSnippetStatus() {
          const isEnabled = customCss.enabledSnippets.has(snippet);
          customCss.setCssEnabledStatus(snippet, !isEnabled);
        }

        toggleComponent
          .setValue(customCss.enabledSnippets.has(snippet))
          .onChange(changeSnippetStatus);

        buttonComponent
          .setIcon("ms-snippet")
          .setClass("MS-OpenSnippet")
          .setTooltip(`Open snippet`)

          .onClick((e: any) => {
            open(`${vaultPath}/${snippetPath}`, {
              app: {
                name: this.settings.applications[0].code,
                arguments: this.settings.applications[0].arguments.split(","),
              },
            });
          });

        snippetElement.onClick((e: any) => {
          e.preventDefault();
          e.stopImmediatePropagation();
        });
      });

      const buttonItem = menuDom.createDiv({ cls: "menu-item buttonitem" });
      const addButton = new ButtonComponent(buttonItem);
      const folderButton = new ButtonComponent(buttonItem);
      addButton
        .setIcon("ms-reload")
        .setClass("MySnippetsButton")
        .setClass("MS-Reload")
        .setTooltip("Reload snippets")
        .onClick((e: any) => {
          customCss.readCssFolders();
        });
      folderButton
        .setIcon("ms-folder")
        .setClass("MySnippetsButton")
        .setClass("MS-Folder")
        .setTooltip("Open snippets folder")
        .onClick((e: any) => {
          window.open(`file://${vaultPath}/${snippetsFolder}`);
        });

      menu.showAtPosition({
        x: statusBarIconRect.right + 5,
        y: statusBarRect.top - 5,
      });
    });
  }

  onunload() {
    console.log("MySnippets unloaded");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
