const app = getApp()

const util = require('../../utils/util.js')

const plugin = requirePlugin("WechatSI")

import { conf } from '../../utils/conf.js'

// import { getEtag } from '../../utils/qetag.js'

const manager = plugin.getRecordRecognitionManager()

const db = wx.cloud.database()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        dialogList: [

        ],

        scroll_top: 10000, // 竖向滚动条位置

        // 初始化卡片内容
        initTranslate: {
            // 为空时的卡片内容
            create: '',
            text: '等待说话',
        },

        // 当前说话内容
        currentTranslate: {

        },

        recordStatus: 0, // 状态： 0 - 录音中 1- 翻译中 2 - 翻译完成/二次翻译
        recording: false, // 正在录音

        toView: 'fake', // 滚动位置
        currentTranslateVoice: '', // 当前播放语音路径
        // 是否已获取用户信息
        userInfo: {},
        openid: "",

        // 说话按钮状态
        talkbtnDisabled: false,

        // 保存按钮状态
        savebtnLoading: false,
        savebtnDisabled: false,
    },


    /**
     * 保存文字和语音 
     */
    saveContent: function(e) {

        console.log('开始保存内容')
        console.log(this.data.dialogList)

        // 如果正在保存
        if (this.data.savebtnDisabled) {
            return
        }

        // 判断是否用户已授权获取信息
        if (!this.data.userInfo) {
            wx.showModal({
                title: '提示',
                content: '请点击右下角笔记页中的头像获取您的名称',
                showCancel: false
            })
            return
        }

        // 判断当前内容是否为空
        if (this.data.dialogList.length <= 0) {
            wx.showModal({
                title: '提示',
                content: '您没有内容可以保存哦',
                showCancel: false
            })
            return
        }

        // 防止重复点击
        this.setData({
                talkbtnDisabled: true,
                savebtnDisabled: true,
                savebtnLoading: true
            })
            // 上传语音文件
        this.uploadRecoding().then((value) => {
            console.log(value)
                // 保存内容
            this.uploadContent().then((value) => {
                console.log(value)
                wx.showToast({
                    title: '保存成功',
                })
                this.setData({
                    talkbtnDisabled: false,
                    savebtnDisabled: false,
                    savebtnLoading: false
                })
            })
        })





    },


    /**
     * 按住按钮开始语音识别
     */
    streamRecord: function(event) {

        // 如果正在保存，就返回
        if (this.data.savebtnDisabled) {
            return
        }

        console.log("触摸开始", event)

        manager.start()

        this.setData({
            recordStatus: 0, // 正在说话
            recording: true, // 正在说话
            currentTranslate: {
                // 当前说话内容
                create: util.recordTime(new Date()),
                text: '正在聆听中',
            }
        })
        this.scrollToNew();
    },

    /**
     * 松开按钮结束语音识别
     */
    endStreamRecord: function(event) {
        console.log('松开按钮结束语音识别', event)

        // 防止重复触发 stop 函数
        if (!this.data.recording || this.data.recordStatus != 0) {
            // 当前不正在录音
            console.warn('has finished!')
            return
        }

        manager.stop()

        // 说话按钮禁止
        this.setData({
            talkbtnDisabled: false,
        })
    },

    /**
     * 重新滚动到底部
     */
    scrollToNew: function() {
        // 弹出新输入语音框
        this.setData({
            toView: this.data.toView
        })
    },
    /**
     * 
     */
    uploadContent: function() {
        return new Promise((resolve, reject) => {

            let _this = this;
            let openid = this.data.openid
            db.collection('user').where({
                _openid: openid // 填入当前用户 openid
            }).get({
                success(res) {
                    console.log('通过 openid 获取用户信息成功', res.data)
                        // 如果用户表中没有此用户就存入
                    if (res.data.length == 0) {
                        // 保存用户信息
                        let userInfo = _this.data.userInfo
                        db.collection('user').add({
                                data: {
                                    nickName: userInfo.nickName, // 昵称
                                    avatarUrl: userInfo.avatarUrl, // 头像
                                    gender: userInfo.gender, // 性别
                                    province: userInfo.province, // 省份
                                    country: userInfo.country, // 城市
                                    city: userInfo.city, // 城市
                                    language: userInfo.language, // 语言
                                    created_at: db.serverDate() // 创建时间
                                }
                            })
                            .then(res => {
                                console.log('[user] [新增记录] 成功，记录 _id: ', res._id)
                            })
                    }
                },
                fail(res) {
                    console.log('通过 openid 获取用户信息失败', res)
                }
            })

            let finishedArry = [];
            let dataArr = this.data.dialogList;
            dataArr.forEach(function(item, index) {
                let data = {}
                data.recording = item;
                finishedArry.push(data);
            })
            console.log("合并后的数组", finishedArry);

            // 保存语音
            db.collection('content').add({
                    data: {
                        created_at: db.serverDate(), // 创建时间
                        content: finishedArry
                    }
                })
                .then(res => {
                    console.log('[content] [新增记录] 成功，记录 _id: ', res._id)
                    this.setData({
                        dialogList: []
                    })
                    this.emptyHistory()
                    resolve("保存内容成功！")
                })
                .catch(console.error)

        })
    },
    /**
     * 上传语音
     */
    uploadRecoding: function() {
        return new Promise((resolve, reject) => {

            console.log('开始上传语音...')
            let dataArr = this.data.dialogList;
            let finished = []
            let _this = this
            dataArr.forEach(function(item, index) {
                console.log(item)
                let filePath = item.temVoicePath
                    // var fileName = Date.parse(new Date())
                wx.getFileInfo({
                    filePath,
                    success(res) {
                        // console.log(res)
                        // console.log(res.size)
                        // console.log(res.digest)
                        let fileName = res.digest
                        let cloudPath = 'recording/' + fileName + filePath.match(/\.[^.]+?$/)[0]
                            //console.log('cloudPath', cloudPath)
                        wx.cloud.uploadFile({
                                cloudPath,
                                filePath,
                            })
                            .then(res => {
                                console.log('[上传文件] 成功：', res)
                                let result = {}
                                result.fileID = res.fileID
                                result.tempFilePath = filePath
                                finished.push(result)
                                console.log("dataArr", dataArr.length)
                                if (finished.length == dataArr.length) {
                                    for (let i = 0; i < finished.length; i++) {
                                        for (let t = 0; t < dataArr.length; t++) {
                                            if (finished[i].tempFilePath == dataArr[t].temVoicePath) {
                                                dataArr[t].fileID = finished[i].fileID
                                            }
                                        }
                                    }
                                    _this.setData({
                                        dialogList: dataArr
                                    })
                                    resolve('全部上传成功！')
                                }

                            }).catch(error => {
                                // handle error
                            })
                    }
                })

            })
        })
    },

    /**
     * 初始化语音识别回调
     * 绑定语音播放开始事件
     */
    initRecord: function() {

        // 正常录音时调用此事件
        manager.onStart = (res) => {
            console.log(res)
        }

        // 识别结束事件
        manager.onStop = (res) => {
            console.log('识别结束', res)

            let text = res.result

            if (text == '') {
                // 如果识别内容为空, 就显示「请说话」图示
                this.showRecordEmptyTip()
                return
            }

            // 数组增加一个元素
            //let lastId = this.data.lastId + 1

            let currentData = Object.assign({}, this.data.currentTranslate, {
                text: res.result, // 识别后文字
                //id: lastId,
                temVoicePath: res.tempFilePath, // 录音临时文件
                temVoiceDuration: res.duration, // 录音总时长
                temFileSize: res.fileSize // 文件大小
            })

            this.setData({
                currentTranslate: currentData,
                recordStatus: 1,
                //lastId: lastId
            })

            this.scrollToNew();

            let index = this.data.dialogList.length;
            let tmpDialogList = this.data.dialogList.slice(0);

            if (!isNaN(index)) {

                // 数组加入新的元素
                tmpDialogList[index] = currentData

                this.setData({
                    dialogList: tmpDialogList,
                    recording: false,
                })
            } else {
                console.error('index error', this.data.dialogList)
            }
            console.log('加入新的语音后', this.data.dialogList)
            this.scrollToNew();

            // 上传语音
            // this.uploadRecoding(res)
            // this.addContent()
        }

        // 识别错误事件
        manager.onError = (res) => {
            console.log(res)
            this.setData({
                recording: false,
                talkbtnDisabled: false
            })
        }

        // 有新的识别内容返回，则会调用此事件
        manager.onRecognize = (res) => {
            console.log('有新的内容识别返回', res)
                // 将所有可枚举属性的值从一个或多个源对象复制到目标对象。它将返回目标对象。
            let currentData = Object.assign({}, this.data.currentTranslate, {
                text: res.result,
            })

            this.setData({
                currentTranslate: currentData,
            })

            this.scrollToNew;
        }

    },

    /**
     * 识别内容为空时的反馈
     */
    showRecordEmptyTip: function() {
        this.setData({
            recording: false,
            talkbtnDisabled: false,
        })

        wx.showToast({
            title: conf.recognize_nothing,
            icon: 'success',
            image: '/images/no_voice.png',
            duration: 1000,
            success: function(res) {
                console.log(res);
            },
            fail: function(res) {
                console.log(res);
            }
        })
    },

    /**
     * 初始化卡片内容
     */
    initCard: function() {
        let initTranslateNew = Object.assign({}, this.data.initTranslate, {
            create: util.recordTime(new Date()),
        })
        this.setData({
            initTranslate: initTranslateNew
        })
    },

    /**
     * 删除卡片
     */
    deleteItem: function(e) {
        console.log('删除卡片', e)
        let detail = e.detail
        let item = detail.item

        let tmpDialogList = this.data.dialogList.slice(0)
        let arrIndex = detail.index
        tmpDialogList.splice(arrIndex, 1)

        this.setData({
            dialogList: tmpDialogList
        })

        if (tmpDialogList.length == 0) {
            this.initCard()
        }
    },

    /**
     * 存储语音识别历史记录到 storage 
     */
    setHistory: function() {
        try {
            let dialogList = this.data.dialogList
            wx.getStorageSync('history', dialogList)
        } catch (e) {
            console.error("setStorageSync setHistory failed")
        }
    },

    /**
     * 得到历史记录
     */
    getHistory: function() {
        wx.showLoading({
            title: '加载中',
        })
        try {
            let history = wx.getStorageSync('history')
            if (history) {
                let len = history.length;
                //let lastId = this.data.lastId
                if (len > 0) {
                    //lastId = history[len-1].id || -1;
                }
                this.setData({
                    dialogList: history,
                    toView: this.data.toView,
                    //lastId: lastId
                })

            }
            wx.hideLoading()
        } catch (e) {
            this.setData({
                dialogList: []
            })
            wx.hideLoading();
        }
    },

    /**
     * 清空历史记录 
     */
    emptyHistory: function() {
        try {
            let history = wx.getStorageSync('history')
            if (history) {
                let len = history.length;
                if (len > 0) {
                    this.setData({
                        dialogList: []
                    })
                }
            }
        } catch (e) {
            this.setData({
                dialogList: []
            })
        }
    },

    /**
     * 初始化全局数据
     */
    initGlobalData: function() {
        this.setData({
            userInfo: app.globalData.userInfo,
            openid: app.globalData.openid,
        })
        let data = {
            userInfo: app.globalData.userInfo,
            openid: app.globalData.openid,
        }
        console.log("首页初始化后的全局参数", data)
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {

        this.getHistory()

        // 初始化语音插件    
        this.initRecord()

        this.setData({
            toView: this.data.toView
        })

        // 获取权限
        app.getRecordAuth()

        console.log(this.data)
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        this.scrollToNew();

        this.initCard()

        this.initGlobalData()
            // 当打开还在识别时，显示透明蒙层，不许触碰
        if (this.data.recordStatus == 2) {
            wx.showLoading({
                mask: true
            })
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {

        this.setHistory();
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }

})