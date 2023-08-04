import { useState } from "react";
import request from "../../utils/request";
import "./index.css";

const SIZE = 2 * 1024 * 1024;

function FileUpload() {
  const [container, setContainer] = useState({ file: null });

  const handleFileChange = (e) => {
    const [file] = e.target.files;
    setContainer({
      file: file,
    });
  };

  /* 一次性上传 */
  // const handleFileUpload = async () => {
  //   if (!container.file) return;
  //   const formData = new FormData();
  //   formData.append("file", container.file);
  //   formData.append("filename", container.file.name);
  //   const res = await request({
  //     url: "/upload",
  //     data: formData,
  //   });
  //   console.log(res);
  // };

  // 创建切片
  const createFileChunk = (file, size = SIZE) => {
    if (!file) return;
    const fileChunkList = [];
    let cur = 0;
    while (cur < file.size) {
      fileChunkList.push({ file: file.slice(cur, cur + size) });
      cur = cur + size;
    }
    return fileChunkList;
  };

  const handleFileUpload = async () => {
    if (!container.file) return;
    const fileChunkList = createFileChunk(container.file);
    let list = fileChunkList.map(({ file }, index) => ({
      chunk: file,
      hash: container.file.name + "-" + index,
    }));

    let requestList = list
      .map(({ chunk, hash }) => {
        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("hash", hash);
        formData.append("filename", container.file.name);
        return { formData };
      })
      .map(({ formData }) =>
        request({
          url: "/upload",
          data: formData,
        })
      );
    await Promise.all(requestList);
    await mergeRequest();
  };

  const mergeRequest = async () => {
    if (!container.file) return;
    await request({
      url: "/merge",
      headers: {
        "content-type": "application/json",
      },
      data: JSON.stringify({
        filename: container.file.name,
        size: SIZE,
      }),
    });
  };

  return (
    <div className="page-upload">
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>上传</button>
      <button onClick={mergeRequest}>merge</button>
    </div>
  );
}

export default FileUpload;
