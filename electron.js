const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

class HandyPCToolsApp {
  constructor() {
    this.mainWindow = null;
    this.setupApp();
  }

  setupApp() {
    // Set app user model ID for Windows
    if (process.platform === "win32") {
      app.setAppUserModelId("com.hantechis.handy-pc-tools");
    }

    // App event listeners
    app.whenReady().then(() => this.createWindow());
    app.on("window-all-closed", this.onWindowAllClosed.bind(this));
    app.on("activate", this.onActivate.bind(this));
    app.on("web-contents-created", this.onWebContentsCreated.bind(this));
  }

  createWindow() {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 1200,
      minHeight: 600,
      icon: this.getAppIcon(),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
      // Use default title bar for proper behavior across platforms
      titleBarStyle: "default",
      titleBarOverlay: false,
      // Enable window controls and proper macOS behavior
      ...(process.platform === "darwin" && {
        trafficLightPosition: { x: 15, y: 13 },
      }),
      show: false, // Don't show until ready
      // Enable maximizable and proper window behavior
      maximizable: true,
      resizable: true,
      fullscreenable: true,
    });

    // Load the app
    const startUrl = isDev
      ? "http://localhost:4200"
      : `file://${path.join(
          __dirname,
          "dist/handy-pc-tools/browser/index.html"
        )}`;

    this.mainWindow.loadURL(startUrl);

    // Show window when ready to prevent visual flash
    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow.show();

      if (isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Handle window closed
    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });

    // Set up the menu
    this.createMenu();
  }

  createMenu() {
    const template = [
      {
        label: "File",
        submenu: [
          {
            label: "New",
            accelerator: "CmdOrCtrl+N",
            click: () => {
              // You can implement new file functionality here
            },
          },
          {
            label: "Open",
            accelerator: "CmdOrCtrl+O",
            click: () => {
              // You can implement open file functionality here
            },
          },
          { type: "separator" },
          {
            label: "Exit",
            accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectall" },
        ],
      },
      {
        label: "View",
        submenu: [
          { role: "reload" },
          { role: "forceReload" },
          { role: "toggleDevTools" },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
      {
        label: "Window",
        submenu: [
          { role: "minimize" },
          {
            label: "Maximize",
            accelerator: "CmdOrCtrl+Ctrl+F",
            click: () => {
              if (this.mainWindow) {
                if (this.mainWindow.isMaximized()) {
                  this.mainWindow.unmaximize();
                } else {
                  this.mainWindow.maximize();
                }
              }
            },
          },
          { type: "separator" },
          { role: "close" },
        ],
      },
      {
        label: "Help",
        submenu: [
          {
            label: "About Handy PC Tools",
            click: () => {
              this.showAbout();
            },
          },
          {
            label: "Visit Website",
            click: () => {
              shell.openExternal("https://handy-pc-tools.web.app");
            },
          },
        ],
      },
    ];

    // macOS specific menu adjustments
    if (process.platform === "darwin") {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: "about" },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      });

      // Window menu
      template[4].submenu = [
        { role: "close" },
        { role: "minimize" },
        { role: "zoom" },
        { type: "separator" },
        { role: "front" },
      ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  showAbout() {
    dialog.showMessageBox(this.mainWindow, {
      type: "info",
      title: "About Handy PC Tools",
      message: "Handy PC Tools",
      detail:
        "An open-source productivity suite for developers and writers.\n\nVersion: 1.0.0\nBuilt with Electron and Angular",
      buttons: ["OK"],
    });
  }

  getAppIcon() {
    if (process.platform === "win32") {
      return path.join(__dirname, "assets/icon.ico");
    } else if (process.platform === "darwin") {
      return path.join(__dirname, "assets/icon.icns");
    } else {
      return path.join(__dirname, "assets/icon.png");
    }
  }

  onWindowAllClosed() {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== "darwin") {
      app.quit();
    }
  }

  onActivate() {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    }
  }

  onWebContentsCreated(event, contents) {
    // Security: Prevent new window creation
    contents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: "deny" };
    });

    // Security: Prevent navigation to external URLs
    contents.on("will-navigate", (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);

      if (
        parsedUrl.origin !== "http://localhost:4200" &&
        !navigationUrl.startsWith("file://")
      ) {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      }
    });
  }
}

// Initialize the app
const app_instance = new HandyPCToolsApp();
