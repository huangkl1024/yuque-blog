import {viteBundler} from "@vuepress/bundler-vite";
import {webpackBundler} from "@vuepress/bundler-webpack";
import {defineUserConfig} from "vuepress";
import {gungnirTheme, i18n} from "vuepress-theme-gungnir";
import {navbar} from "./configs";

const isProd = process.env.NODE_ENV === "production";

export default defineUserConfig({
  base: "/",

  head: [
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: `/img/logo/favicon-16x16.png`
      }
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: `/img/logo/favicon-32x32.png`
      }
    ],
    ["link", { rel: "manifest", href: "/manifest.webmanifest" }],
    ["meta", { name: "application-name", content: "Huangkl Blog" }],
    ["meta", { name: "apple-mobile-web-app-title", content: "Huangkl Blog" }],
    [
      "meta",
      { name: "apple-mobile-web-app-status-bar-style", content: "black" }
    ],
    [
      "link",
      { rel: "apple-touch-icon", href: `/img/logo/apple-touch-icon.png` }
    ],
    ["meta", { name: "theme-color", content: "#377bb5" }],
    ["meta", { name: "msapplication-TileColor", content: "#377bb5" }]
  ],

  // site-level locales config
  locales: {
    "/": {
      lang: "en-US",
      title: "Huangkl Blog",
      description: "Personal blog for huangkl"
    },
    "/zh/": {
      lang: "zh-CN",
      title: "Huangkl Blog",
      description: "黄开龙个人博客"
    }
  },

  // specify bundler via environment variable
  bundler:
    process.env.DOCS_BUNDLER === "webpack" ? webpackBundler() : viteBundler(),

  // configure default theme
  theme: gungnirTheme({
    // repo: "Renovamen/vuepress-theme-gungnir",
    docsDir: "docs",

    hitokoto: "https://v1.hitokoto.cn?c=i", // enable hitokoto (一言) or not?

    // personal information
    personalInfo: {
      name: "Huangkl",
      avatar: "/img/avatar.jpg",
      description: "知识有两种，一种是你知道的，一种是你知道在哪里能找到的！",
      sns: {
        github: "huangkl1024",
        // linkedin: "xiaohan-zou-55bba0160",
        // facebook: "renovamen.zou",
        // twitter: "renovamen_zxh",
        // zhihu: "chao-neng-gui-su",
        email: "huangkl1024@gmail.com",
        rss: "/rss.xml",
        // customized sns
        gitee: {
          icon: "si-gitee",
          link: "https://gitee.com/huangkl1024"
        }
        // bilibili: {
        //   icon: "ri-bilibili-line",
        //   link: "https://www.bilibili.com/"
        // }
      }
    },

    // header images on home page
    homeHeaderImages: [
      {
        path: "/img/home-bg/1.jpg",
        mask: "rgba(40, 57, 101, .4)"
      },
      {
        path: "/img/home-bg/2.jpg",
        mask: "rgb(251, 170, 152, .2)"
      },
      {
        path: "/img/home-bg/3.jpg",
        mask: "rgba(68, 74, 83, .1)"
      },
      {
        path: "/img/home-bg/4.jpg",
        mask: "rgba(19, 75, 50, .2)"
      }
    ],

    // other pages
    pages: {
      tags: {
        subtitle: "飞鸟不留痕，但我已飞过。",
        bgImage: {
          path: "/img/pages/tags.jpg",
          mask: "rgba(211, 136, 37, .5)"
        }
      },
      links: {
        subtitle:
          "为了理想，我宁愿忍受寂寞，饮尽那份孤独。",
        bgImage: {
          path: "/img/pages/links.jpg",
          mask: "rgba(64, 118, 190, 0.5)"
        }
      }
    },

    // theme-level locales config
    locales: {
      /**
       * English locale config
       *
       * As the default locale is English, we don't need to set all of the locale fields
       */
      "/": {
        // navbar
        navbar: navbar.en,
        // sidebar
        // sidebar: sidebar.en
      },

      /**
       * Chinese locale config
       */
      "/zh/": {
        // navbar
        navbar: navbar.zh,
        // sidebar
        // sidebar: sidebar.zh,
        // i18n
        ...i18n.zh
      }
    },

    themePlugins: {
      // only enable git plugin in production mode
      git: isProd,
      katex: true,
      mermaid: true,
      chartjs: true,
      // giscus: {
      //   repo: "This-is-an-Apple/gitalk-comments",
      //   repoId: "MDEwOlJlcG9zaXRvcnkyMTA1MjQyMTQ=",
      //   category: "Announcements",
      //   categoryId: "DIC_kwDODIxYNs4CAO1u",
      //   lazyLoad: true
      // },
      mdPlus: {
        all: true
      },
      // ga: "G-EE8M2S3MPB",
      // ba: "10b7bc420625758a319d6b23aed4700f",
      rss: {
        siteURL: "blog.huangkailong.com",
        copyright: "Huangkl 2018-2022"
      },
      pwa: true,
      search: {

      },
      readingTime: {
        wordsPerMinuteCN: 500,  // 一分钟可以阅读多少个中文字符（可选，默认：300）
        wordsPerMinuteEN: 200,  // 一分钟可以阅读多少个英文字符（可选，默认：160）
        excludeCodeBlock: true,  // 是否排除所有代码块内的字符（可选，默认：false）
        excludeTexBlock: true    // 是否排除所有公式块内的字符（可选，默认：false）
      }
    },

    footer: `
      &copy; <a href="https://github.com/huangkl2" target="_blank">Huangkl</a> 2020-2022
      <br>
      Powered by <a href="https://v2.vuepress.vuejs.org" target="_blank">VuePress</a> &
      <a href="https://github.com/Renovamen/vuepress-theme-gungnir" target="_blank">Gungnir</a>
    `
  }),

  markdown: {
    headers: {
      level: [2, 3, 4, 5]
    }
  },

  plugins: [
    // docsearchPlugin({
    //   appId: "3DDLGP0IG4",
    //   apiKey: "6556adaa82b31485309b440a525f264a",
    //   indexName: "v2-vuepress-theme-gungnir",
    //   locales: {
    //     "/zh/": {
    //       placeholder: "搜索文档",
    //       translations: {
    //         button: {
    //           buttonText: "搜索文档",
    //           buttonAriaLabel: "搜索文档"
    //         },
    //         modal: {
    //           searchBox: {
    //             resetButtonTitle: "清除查询条件",
    //             resetButtonAriaLabel: "清除查询条件",
    //             cancelButtonText: "取消",
    //             cancelButtonAriaLabel: "取消"
    //           },
    //           startScreen: {
    //             recentSearchesTitle: "搜索历史",
    //             noRecentSearchesText: "没有搜索历史",
    //             saveRecentSearchButtonTitle: "保存至搜索历史",
    //             removeRecentSearchButtonTitle: "从搜索历史中移除",
    //             favoriteSearchesTitle: "收藏",
    //             removeFavoriteSearchButtonTitle: "从收藏中移除"
    //           },
    //           errorScreen: {
    //             titleText: "无法获取结果",
    //             helpText: "你可能需要检查你的网络连接"
    //           },
    //           footer: {
    //             selectText: "选择",
    //             navigateText: "切换",
    //             closeText: "关闭",
    //             searchByText: "搜索提供者"
    //           },
    //           noResultsScreen: {
    //             noResultsText: "无法找到相关结果",
    //             suggestedQueryText: "你可以尝试查询",
    //             reportMissingResultsText: "你认为该查询应该有结果？",
    //             reportMissingResultsLinkText: "点击反馈"
    //           }
    //         }
    //       }
    //     }
    //   }
    // })
  ]
});
