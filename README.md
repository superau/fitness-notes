## 音录往昔

> 原名：「健身小笔记」

## 简介

一个试图去捕捉心情感受的小程序

> 原本希望做一个帮助健身爱好者通过录音或文字迅速记录身体状态，之后用来总结并及时修改训练计划的小程序
>
> 但是做着做着发现，其实通过当时的录音，可以记录下当时不同的情绪，快乐、伤心、兴奋、忧愁等等，在之后的某一天打开便可以通过听语音感受当时的心情，不方便时也可以看一下语音识别后的。

## 架构

- 小程序云开发
  - 云数据库，保存语音和识别后文字内容
  - 云存储，上传语音文件


## 小程序预览

<img src="https://blog.firedata.club/a7481e12496513d93258cdc1db13a175" width=400>

## 悲剧

满心欢喜做完提交代码，希望尽快通过审核与大家见面。结果悲剧了，**没通过微信审核**，我还纳闷怎么回事呢。

<img src="https://blog.firedata.club/2531461eb928869074d6751dd953d5c1" width=400>

原来我的小程序涉及到提供备忘录、日记、记事服务，备忘录这些并不对**个人主体**开放的类目，涉及到「内容」，只有企业主体才可以开发这样的小程序。

怪自己当时，突然有个想法就开始做了，看都没看微信开放的类目，结果还没开始，就被扼杀在摇篮里了。不过要是提前知道了，估计也就不做了，没有这次学习小程序，长教训的机会了，患得患失吧。

希望放在这里，有兴趣的朋友可以下载下来体验一下吧。

## 安装

1. 克隆代码
2. `project.config.json` 中的 `appid` 替换成在公众平台申请的项目 id
3. 在 `公众平台 → 设置 → 第三方服务 → 插件管理` 中 添加微信同声传译插件 (`wx069ba97219f66d99`)
4. 打开微信开发者工具中添加项目

## 感谢

- [面对面翻译](https://github.com/Tencent/Face2FaceTranslator) 看到它才给了我做这款小程序的动力，因为它可以语音识别，并且腾讯出品，参考了很多它的代码，非常非常感谢，受益颇多！
- [ColorUI](https://github.com/weilanwl/ColorUI) 超级好用的 css，非常漂亮，而且用起来清晰明了，也适用于 [uni-app](https://github.com/dcloudio/uni-app) 跨平台开发框架！