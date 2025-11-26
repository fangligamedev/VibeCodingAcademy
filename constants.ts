import { Level, Language, World } from './types';

export const WORLDS_EN: World[] = [
    { id: 1, title: "Novice Station", description: "Learn the basics of Python and Pygame.", themeColor: "indigo" },
    { id: 2, title: "Artist Alley", description: "Master shapes, colors, and drawing.", themeColor: "pink" },
    { id: 3, title: "Mover's Gym", description: "Understand coordinates and movement.", themeColor: "blue" },
    { id: 4, title: "Logic Lab", description: "Use if-statements and collision detection.", themeColor: "purple" },
    { id: 5, title: "Game Arena", description: "Build full interactive loops.", themeColor: "orange" }
];

export const WORLDS_ZH: World[] = [
    { id: 1, title: "新手空间站", description: "学习 Python 和 Pygame 的基础知识。", themeColor: "indigo" },
    { id: 2, title: "艺术家画廊", description: "掌握形状、颜色和绘图。", themeColor: "pink" },
    { id: 3, title: "运动健身房", description: "理解坐标和移动。", themeColor: "blue" },
    { id: 4, title: "逻辑实验室", description: "使用 if 语句和碰撞检测。", themeColor: "purple" },
    { id: 5, title: "游戏竞技场", description: "构建完整的交互循环。", themeColor: "orange" }
];

// Helper to generate a generic level to fill up the 50 slots for the demo
const createGenericLevel = (id: number, worldId: number, lang: Language): Level => {
    const isZh = lang === 'zh';
    return {
        id,
        worldId,
        title: isZh ? `训练任务 ${id}` : `Training Mission ${id}`,
        description: isZh ? "巩固你的编程技能。" : "Reinforce your coding skills.",
        maxStars: 3,
        previewImage: `https://picsum.photos/400/300?random=${id}`,
        steps: [
            {
                id: 1,
                instruction: isZh ? "让我们设置环境。导入 pygame。" : "Let's set up. Import pygame.",
                hint: "import pygame",
                expectedAction: "IMPORT_PYGAME",
                pythonSnippet: isZh 
                    ? "# 导入 Pygame 游戏库\nimport pygame\n# 启动游戏引擎\npygame.init()" 
                    : "# Import the Pygame library\nimport pygame\n# Initialize the game engine\npygame.init()"
            },
            {
                id: 2,
                instruction: isZh ? "创建一个窗口。" : "Create a window.",
                hint: "screen = ...",
                expectedAction: "CREATE_SCREEN",
                pythonSnippet: isZh
                    ? "# 设置屏幕大小为 800x600\nscreen = pygame.display.set_mode((800, 600))"
                    : "# Set screen size to 800x600\nscreen = pygame.display.set_mode((800, 600))"
            },
            {
                id: 3,
                instruction: isZh ? "更新显示。" : "Update the display.",
                hint: "display.flip()",
                expectedAction: "UPDATE_DISPLAY",
                pythonSnippet: isZh
                    ? "# 更新屏幕显示以查看更改\npygame.display.flip()"
                    : "# Update the display to show changes\npygame.display.flip()"
            }
        ]
    };
};

const LEVELS_EN_RAW: Level[] = [
  // --- WORLD 1: NOVICE STATION ---
  {
    id: 1,
    worldId: 1,
    title: "Mission: Hello Space",
    description: "Learn how to wake up your computer using Python!",
    maxStars: 3,
    previewImage: "https://picsum.photos/400/300?grayscale",
    steps: [
      {
        id: 1,
        instruction: "Let's start our game engine. Tell me to 'import the pygame library'.",
        hint: "Try typing: 'Import pygame for me'",
        expectedAction: 'IMPORT_PYGAME',
        pythonSnippet: "# Import the Pygame library\nimport pygame\nimport sys\n\n# Initialize the game engine\npygame.init()"
      },
      {
        id: 2,
        instruction: "Now we need a window to see the stars. Ask me to 'create a screen'.",
        hint: "Say: 'Create a game screen size 800 by 600'",
        expectedAction: 'CREATE_SCREEN',
        pythonSnippet: "# Set up the game window (Width=800, Height=600)\nscreen = pygame.display.set_mode((800, 600))\n# Give the window a title\npygame.display.set_caption('My First Space Game')"
      },
      {
        id: 3,
        instruction: "Space is dark! Tell me to 'fill the background with black color'.",
        hint: "Type: 'Fill the screen with black'",
        expectedAction: 'FILL_BLACK',
        pythonSnippet: "# Fill the screen with Black color (Red=0, Green=0, Blue=0)\nscreen.fill((0, 0, 0))\n# Refresh the display to show the color\npygame.display.flip()"
      }
    ]
  },
  {
    id: 2,
    worldId: 1,
    title: "Mission: The Red Alert",
    description: "Change the background color to signal an alert.",
    maxStars: 3,
    previewImage: "https://picsum.photos/400/300?red",
    steps: [
       {
        id: 1,
        instruction: "Start the engine again. Import pygame.",
        hint: "Import pygame",
        expectedAction: 'IMPORT_PYGAME',
        pythonSnippet: "# Import Pygame\nimport pygame\n# Initialize the system\npygame.init()"
      },
      {
        id: 2,
        instruction: "Create the screen again.",
        hint: "Create screen 800x600",
        expectedAction: 'CREATE_SCREEN',
        pythonSnippet: "# Create the game window\nscreen = pygame.display.set_mode((800, 600))"
      },
      {
        id: 3,
        instruction: "Fill the screen with Red for emergency!",
        hint: "Fill screen red (255, 0, 0)",
        expectedAction: 'FILL_RED',
        pythonSnippet: "# Fill background with Red (Red=255, Green=0, Blue=0)\nscreen.fill((255, 0, 0))\n# Update the screen\npygame.display.flip()"
      }
    ]
  },
  
  // --- WORLD 2: ARTIST ALLEY ---
  {
    id: 11,
    worldId: 2,
    title: "Mission: Draw the Hero",
    description: "Create your main character using shapes and variables.",
    maxStars: 3,
    previewImage: "https://picsum.photos/400/300?blur",
    steps: [
      {
        id: 1,
        instruction: "We need a hero color. Define a variable called 'hero_color' that is blue.",
        hint: "Say: 'Create a variable named hero_color for blue'",
        expectedAction: 'DEFINE_COLOR',
        pythonSnippet: "# Define the color Blue using RGB values\nhero_color = (0, 0, 255)"
      },
      {
        id: 2,
        instruction: "Let's draw our hero! Ask me to 'draw a circle' using our hero color.",
        hint: "Type: 'Draw a circle in the middle using hero_color'",
        expectedAction: 'DRAW_HERO',
        pythonSnippet: "# Draw a circle on the screen\n# Arguments: Surface, Color, Position (x,y), Radius\npygame.draw.circle(screen, hero_color, (400, 300), 30)"
      },
      {
        id: 3,
        instruction: "Let's make it glow. Ask me to update the display.",
        hint: "Say: 'Update the display to show changes'",
        expectedAction: 'UPDATE_DISPLAY',
        pythonSnippet: "# Update the display to show what we drew\npygame.display.flip()"
      }
    ]
  },

  // --- WORLD 3: MOVER'S GYM ---
  {
    id: 21,
    worldId: 3,
    title: "Mission: First Steps",
    description: "Move the hero to a new position.",
    maxStars: 3,
    previewImage: "https://picsum.photos/400/300?tech",
    steps: [
      {
        id: 1,
        instruction: "Define starting coordinates x and y.",
        hint: "x = 100, y = 100",
        expectedAction: 'DEFINE_VARS',
        pythonSnippet: "# Set initial position variables\nx = 100\ny = 100"
      },
      {
        id: 2,
        instruction: "Change x to move right. Add 50 to x.",
        hint: "x = x + 50",
        expectedAction: 'MOVE_RIGHT',
        pythonSnippet: "# Increase x to move right\nx += 50"
      },
      {
        id: 3,
        instruction: "Draw the hero at the new x, y.",
        hint: "Draw circle at (x, y)",
        expectedAction: 'DRAW_HERO_MOVED',
        pythonSnippet: "# Draw the hero at the new position (x, y)\npygame.draw.circle(screen, (0,0,255), (x, y), 30)\n# Refresh display\npygame.display.flip()"
      }
    ]
  }
];

const LEVELS_ZH_RAW: Level[] = [
    // --- WORLD 1: NOVICE STATION (ZH) ---
  {
    id: 1,
    worldId: 1,
    title: "任务：你好，太空",
    description: "学习如何用 Python 唤醒你的电脑！",
    maxStars: 3,
    previewImage: "https://picsum.photos/400/300?grayscale",
    steps: [
      {
        id: 1,
        instruction: "让我们启动游戏引擎。告诉我 '导入 pygame 库'。",
        hint: "试着输入：'帮我导入 pygame'",
        expectedAction: 'IMPORT_PYGAME',
        pythonSnippet: "# 导入 pygame 库\nimport pygame\nimport sys\n\n# 初始化游戏引擎\npygame.init()"
      },
      {
        id: 2,
        instruction: "现在我们需要一个窗口来看星星。让我 '创建一个屏幕'。",
        hint: "说：'创建一个 800 x 600 的游戏屏幕'",
        expectedAction: 'CREATE_SCREEN',
        pythonSnippet: "# 创建一个 800x600 的窗口\nscreen = pygame.display.set_mode((800, 600))\n# 设置窗口标题\npygame.display.set_caption('我的第一个太空游戏')"
      },
      {
        id: 3,
        instruction: "太空是黑暗的！告诉我 '用黑色填充背景'。",
        hint: "输入：'把屏幕填充为黑色'",
        expectedAction: 'FILL_BLACK',
        pythonSnippet: "# 用黑色填充背景 (红=0, 绿=0, 蓝=0)\nscreen.fill((0, 0, 0))\n# 更新显示以查看颜色\npygame.display.flip()"
      }
    ]
  },
  {
    id: 2,
    worldId: 1,
    title: "任务：红色警报",
    description: "将背景颜色更改为红色以发出警报信号。",
    maxStars: 3,
    previewImage: "https://picsum.photos/400/300?red",
    steps: [
       {
        id: 1,
        instruction: "再次启动引擎。导入 pygame。",
        hint: "导入 pygame",
        expectedAction: 'IMPORT_PYGAME',
        pythonSnippet: "# 导入 Pygame\nimport pygame\n# 初始化系统\npygame.init()"
      },
      {
        id: 2,
        instruction: "再次创建屏幕。",
        hint: "创建 800x600 的屏幕",
        expectedAction: 'CREATE_SCREEN',
        pythonSnippet: "# 创建游戏窗口\nscreen = pygame.display.set_mode((800, 600))"
      },
      {
        id: 3,
        instruction: "用红色填充屏幕以表示紧急情况！",
        hint: "填充红色 (255, 0, 0)",
        expectedAction: 'FILL_RED',
        pythonSnippet: "# 用红色填充背景 (红=255, 绿=0, 蓝=0)\nscreen.fill((255, 0, 0))\n# 更新屏幕\npygame.display.flip()"
      }
    ]
  },

  // --- WORLD 2: ARTIST ALLEY (ZH) ---
  {
    id: 11,
    worldId: 2,
    title: "任务：绘制英雄",
    description: "使用形状和变量创建你的主角。",
    maxStars: 3,
    previewImage: "https://picsum.photos/400/300?blur",
    steps: [
      {
        id: 1,
        instruction: "我们需要定义英雄的颜色。定义一个变量叫 'hero_color'，它是蓝色的。",
        hint: "说：'创建一个名为 hero_color 的变量，颜色为蓝色'",
        expectedAction: 'DEFINE_COLOR',
        pythonSnippet: "# 定义蓝色的 RGB 颜色变量\nhero_color = (0, 0, 255)"
      },
      {
        id: 2,
        instruction: "让我们画出英雄！让我用英雄的颜色 '画一个圆'。",
        hint: "输入：'在中间用 hero_color 画一个圆'",
        expectedAction: 'DRAW_HERO',
        pythonSnippet: "# 在屏幕上画一个圆\n# 参数：屏幕, 颜色, 位置(x,y), 半径\npygame.draw.circle(screen, hero_color, (400, 300), 30)"
      },
      {
        id: 3,
        instruction: "让它发光吧。让我更新显示。",
        hint: "说：'更新显示以显示更改'",
        expectedAction: 'UPDATE_DISPLAY',
        pythonSnippet: "# 更新显示以展示我们画的内容\npygame.display.flip()"
      }
    ]
  },
    // --- WORLD 3: MOVER'S GYM (ZH) ---
  {
    id: 21,
    worldId: 3,
    title: "任务：第一步",
    description: "将英雄移动到新位置。",
    maxStars: 3,
    previewImage: "https://picsum.photos/400/300?tech",
    steps: [
      {
        id: 1,
        instruction: "定义起始坐标 x 和 y。",
        hint: "x = 100, y = 100",
        expectedAction: 'DEFINE_VARS',
        pythonSnippet: "# 设置初始坐标变量\nx = 100\ny = 100"
      },
      {
        id: 2,
        instruction: "改变 x 以向右移动。给 x 加上 50。",
        hint: "x = x + 50",
        expectedAction: 'MOVE_RIGHT',
        pythonSnippet: "# 增加 x 坐标向右移动\nx += 50"
      },
      {
        id: 3,
        instruction: "在新位置 x, y 绘制英雄。",
        hint: "在 (x, y) 画圆",
        expectedAction: 'DRAW_HERO_MOVED',
        pythonSnippet: "# 在新位置 (x, y) 绘制英雄\npygame.draw.circle(screen, (0,0,255), (x, y), 30)\n# 刷新显示\npygame.display.flip()"
      }
    ]
  }
];

// GENERATOR: Fill the gaps to make 50 levels (10 per world)
const fillLevels = (baseLevels: Level[], lang: Language) => {
    const fullList = [...baseLevels];
    const existingIds = new Set(baseLevels.map(l => l.id));

    // World 1: 1-10
    // World 2: 11-20
    // World 3: 21-30
    // World 4: 31-40
    // World 5: 41-50

    for (let w = 1; w <= 5; w++) {
        for (let i = 1; i <= 10; i++) {
            const levelId = (w - 1) * 10 + i;
            if (!existingIds.has(levelId)) {
                fullList.push(createGenericLevel(levelId, w, lang));
            }
        }
    }
    return fullList.sort((a, b) => a.id - b.id);
};

export const getLevels = (lang: Language): Level[] => {
    return lang === 'zh' ? fillLevels(LEVELS_ZH_RAW, 'zh') : fillLevels(LEVELS_EN_RAW, 'en');
};

export const getWorlds = (lang: Language): World[] => {
    return lang === 'zh' ? WORLDS_ZH : WORLDS_EN;
}