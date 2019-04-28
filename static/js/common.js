function getDate() {
    let now = new Date();
    let Y = now.getFullYear();
    let M = now.getMonth() + 1;
    let m;
    M < 10 ? m = '0' + M.toString() : m = M.toString();
    return Y.toString() + m
}

function getNewname(file) {
    return getDate() + '/' + file.lastModified.toString() + file.size.toString() + '.jpg';
}

function copyImagUrl(id) {
    let text = 'https://' + $.cookie('bucket') + '.' + $.cookie('region') + '.aliyuncs.com/' + getDate() + '/' + document.getElementById(id).title;
    let input = document.getElementById("copy_temp");
    input.value = text; // 修改文本框的内容
    input.select(); // 选中文本
    document.execCommand("copy"); // 执行浏览器复制命令
}

function keepCookie() {
    let msg = '';
    let variety = ["region", "accessKeyId", "accessKeySecret", "bucket"];
    for (let i = 0; i < variety.length; i++) {
        if (!document.getElementById(variety[i]).value) {
            msg = variety[i] + ' 不能为空';
            if (msg) {
                break
            }
        } else {
            document.cookie = variety[i] + "=" + document.getElementById(variety[i]).value;
        }
    }
    if (!msg) {
        msg = '配置保存成功'
    }
    $('.alert-danger').remove();
    $("#form").append('<div class="alert alert-danger">\n' +
        '        <a href="#" class="close" data-dismiss="alert"></a>\n' +
        '        <strong>' + msg + '</strong>\n' +
        '    </div>');
}

function checkConfig() {
    try {
        new OSS({
            region: $.cookie('region'),
            accessKeyId: $.cookie('accessKeyId'),
            accessKeySecret: $.cookie('accessKeySecret'),
            bucket: $.cookie('bucket'),
            secure: true
        });
        return true
    } catch (e) {
        $(".kv-main").append('<div class="alert alert-danger">\n' +
            '        <a href="#" class="close" data-dismiss="alert"></a>\n' +
            '        <strong>请先对图床进行配置</strong>\n' +
            '    </div>');
        $("#smfile").fileinput('disable');
    }
}