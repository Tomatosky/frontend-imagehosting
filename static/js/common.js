function getDate() {
    let now = new Date(),
        Y = now.getFullYear(),
        M = now.getMonth() + 1,
        m;
    M < 10 ? m = '0' + M.toString() : m = M.toString();
    return Y.toString() + m
}

function appendKvMain(level, content, disappear = false) {
    $('.alert-info').remove();
    $('.alert-success').remove();

    let kvMain = $(".kv-main");
    kvMain.append('<div class="alert alert-' + level + '"' + '">' +
        '<a href="#" class="close" data-dismiss="alert"></a><strong>' +
        content + '</strong></div>');
    if (disappear) {
        setTimeout(function () {
            $('.alert').remove();
        }, 1500);
    }
}

function generateImagUrl(imagePath) {
    let domain;
    let company = localStorage.getItem('company');
    if (localStorage.getItem(company + '_ownDomain')) {
        domain = localStorage.getItem(company + '_ownDomain')
    } else {
        if (company === 'oss') {
            domain = localStorage.getItem(company + '_bucket') + '.' + localStorage.getItem(company + '_region') + '.aliyuncs.com'
        } else {
            domain = localStorage.getItem(company + '_bucket') + '.cos.' + localStorage.getItem(company + '_region') + '.myqcloud.com'
        }
    }
    let url = 'https://' + domain + '/' + imagePath;
    let md = '![](' + url + ')';
    if (localStorage.getItem('type') === 'markdown') {
        url = md
    }
    let input = document.getElementById("copy_temp");
    input.value = url; // 修改文本框的内容
    input.select(); // 选中文本
    document.execCommand("copy"); // 执行浏览器复制命令
    appendKvMain('success', '复制链接成功', true);
}

function keepConfig() {
    let company = localStorage.getItem('company');
    let button = $('.btn-default');
    button.attr("disabled", true);
    $('.alert').remove();
    let msg;
    let variety = ["region", "accessKeyId", "accessKeySecret", "bucket", "ownDomain"];
    for (let i = 0; i < variety.length; i++) {
        let varietyValue = $('#' + variety[i]).val();
        if (!varietyValue && variety[i] !== "ownDomain") {
            msg = variety[i] + ' 不能为空';
            if (msg) {
                break
            }
        } else {
            localStorage.setItem(company + '_' + variety[i], varietyValue);
        }
    }
    if (!msg) {
        let client = getClient();
        company === 'oss' ? checkOss(client) : checkCos(client)
    } else {
        appendKvMain('danger', msg);
    }
    button.removeAttr("disabled");
}

function getClient() {
    let company = localStorage.getItem('company');
    let client;
    if (company === 'oss') {
        client = new OSS({
            region: localStorage.getItem('oss_region'),
            accessKeyId: localStorage.getItem('oss_accessKeyId'),
            accessKeySecret: localStorage.getItem('oss_accessKeySecret'),
            bucket: localStorage.getItem('oss_bucket'),
            secure: true,
            timeout: 2000
        });
    } else {
        client = new COS({
            SecretId: localStorage.getItem('cos_accessKeyId'),
            SecretKey: localStorage.getItem('cos_accessKeySecret'),
            Timeout: 2000
        });
    }
    return client;
}

function checkOss(client) {
    client.list({
        'max-keys': 1
    }).then(function (result) {
        appendKvMain('success', 'oss配置成功');
        $("#smfile").fileinput('enable');
    }).catch(function (err) {
        if (err.toString().indexOf("ConnectionTimeoutError") !== -1) {
            appendKvMain('danger', '连接超时，请检查region和bucket');
        }
        if (err.toString().indexOf("Access Key Id you provided") !== -1) {
            appendKvMain('danger', 'accessKeyId 填写出错');
        }
        if (err.toString().indexOf("signature we calculated") !== -1) {
            appendKvMain('danger', 'accessKeySecret 填写出错');
        }
        appendKvMain('danger', err);
    });
}

function checkCos(client) {
    client.getBucket({
        Bucket: localStorage.getItem('cos_bucket'),
        Region: localStorage.getItem('cos_region'),
    }, function (err, data) {
        if (err) {
            appendKvMain('danger', err);
        } else {
            appendKvMain('success', 'cos配置成功');
            $("#smfile").fileinput('enable');
        }
    });
}

function checkConfig() {
    appendKvMain('info', '正在检测图床配置');
    let company = localStorage.getItem('company'),
        region = localStorage.getItem(company + '_region'),
        accessKeyId = localStorage.getItem(company + '_accessKeyId'),
        accessKeySecret = localStorage.getItem(company + '_accessKeySecret'),
        bucket = localStorage.getItem(company + '_bucket');

    if (company && region && accessKeyId && accessKeySecret && bucket) {
        let client = getClient();
        company === 'oss' ? checkOss(client) : checkCos(client);
    } else {
        appendKvMain('danger', '请先对图床进行配置');
    }
}

function upload2cos(client, file, filename) {
    client.putObject({
        Bucket: localStorage.getItem('cos_bucket'),
        Region: localStorage.getItem('cos_region'),
        Key: filename,
        StorageClass: 'STANDARD',
        Body: file,
    }, function (err, data) {
        if (err) {
            appendKvMain('danger', file.name + '上传失败！ ' + err);
        } else {
            console.log(data);
            appendKvMain('success', file.name + ' 上传成功', true);
            $(".file-preview-frame").on("click", function () {
                generateImagUrl($(this).attr('data-fileid'));
            });
        }
    });
}

function upload2oss(client, file, filename) {
    client.multipartUpload(filename, file).then(function (result) {
        console.log(result);
        appendKvMain('success', file.name + ' 上传成功', true);
        $(".file-preview-frame").on("click", function () {
            generateImagUrl($(this).attr('data-fileid'));
        });
    }).catch(function errorMsg(err) {
        appendKvMain('danger', file.name + '上传失败！ ' + err);
    });
}

function uploadImg(files) {
    let client = getClient();
    let company = localStorage.getItem('company')
    for (let i = 0; i < files.length; i++) {
        let file = files[i],
            newName = getDate() + '/' + file.lastModified.toString() + file.size.toString() + '.' + file.name.split('.')[file.name.split('.').length - 1];

        appendKvMain('info', '正在上传文件：' + newName, true);
        company === 'oss' ? upload2oss(client, file, newName) : upload2cos(client, file, newName)
    }
}

function checkType() {
    let radio = $(".radio");
    if (localStorage.getItem('type') === 'url') {
        radio.append('<label><input type="radio" name="type" checked/>url</label>\n' +
            '<label><input type="radio" name="type" id="markdown"/>markdown</label>')
    } else {
        radio.append('<label><input type="radio" name="type"/>url</label>\n' +
            '<label><input type="radio" name="type" checked/>markdown</label>')
    }
}
