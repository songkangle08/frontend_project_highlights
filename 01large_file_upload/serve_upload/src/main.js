const express = require("express");
const cors = require("cors");
const path = require("path");
const multiparty = require("multiparty");
const bodyParser = require("body-parser");
const fs = require("fs");
const fse = require("fs-extra");

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const UPLOAD_DIR = path.resolve(__dirname, "..", "target");

app.get("/", (req, res) => {
  res.send("hello world!!");
});

app.post("/upload", async (req, res) => {
  const multipartForm = new multiparty.Form();
  // multipartForm.uploadDir = UPLOAD_DIR;
  multipartForm.parse(req, async function (err, fields, files) {
    if (err) {
      console.log(err);
      return;
    }
    try {
      // console.log(fields, files);
      // let uploadFile = files.chunk[0];
      // let newpath = path.resolve(
      //   multipartForm.uploadDir,
      //   uploadFile.originalFilename
      // );
      // console.log(newpath);
      // fs.renameSync(uploadFile.path, newpath);
      // res.send({
      //   code: 0,
      //   data: null,
      //   msg: "上传成功",
      // });
      console.log(fields, files, "files");
      const [chunk] = files.chunk;
      const [hash] = fields.hash;
      const [filename] = fields.filename; // 创建临时文件夹用于临时存储 chunk // 添加 chunkDir 前缀与文件名做区分
      const chunkDir = path.resolve(UPLOAD_DIR, "chunkDir" + filename);
      if (!fse.existsSync(chunkDir)) {
        await fse.mkdirs(chunkDir);
      }
      // @see https://github.com/meteor/meteor/issues/7852#issuecomment-255767835
      // fs-extra 的 rename 方法 windows 平台会有权限问题
      await fse.rename(chunk.path, `${chunkDir}/${hash}`);

      res.send("11111");
    } catch (e) {
      console.log(e);
      res.send({
        code: 0,
        data: null,
      });
    }
  });
});

const pipeStream = (path, writeStream) =>
  new Promise((resolve) => {
    const readStream = fse.createReadStream(path);
    readStream.on("end", () => {
      fse.unlinkSync(path);
      console.log("111");
      resolve(111);
    });
    readStream.pipe(writeStream);
  });

const mergeFileChunk = async (filePath, filename, size) => {
  const chunkDir = path.resolve(UPLOAD_DIR, "chunkDir" + filename);
  console.log(chunkDir, "chunkDir");
  const chunkPaths = await fse.readdir(chunkDir);
  // 根据切片进行排序
  chunkPaths.sort((a, b) => a.split("-")[1] - b.split("-")[1]);
  console.log(chunkPaths, "chunkPaths");
  // 并发写入文件
  await Promise.all(
    chunkPaths.map((chunkPath, index) =>
      pipeStream(
        path.resolve(chunkDir, chunkPath), // 根据 size 在指定位置创建可写流
        fse.createWriteStream(filePath, {
          start: index * size,
        })
      )
    )
  );
  await fse.rmdirSync(chunkDir);
};

app.post("/merge", async (req, res) => {
  const { filename, size } = req.body;
  const filePath = path.resolve(UPLOAD_DIR, `${filename}`);
  console.log(filePath, "filePathfilePath");
  await mergeFileChunk(filePath, filename, size);
  res.end("11111");
});

app.get("/copy", async (req, res) => {
  let filePath = path.resolve(
    UPLOAD_DIR,
    "印客2023大厂前端工程师训练营大纲0710.pdf"
  );
  const readStream = fse.createReadStream(filePath);
  readStream.on("data", (e, data) => {
    console.log(e, data, 2222);
  });
  readStream.on("end", () => {});
});

app.listen(5000, () => {
  console.log("serve is running port in 5000");
});
