# 大文件上传

## 整体思路

### 前端
前端大文件上传的解决方案：核心是利用Blob.prototype.slice方法，把文件分成若干个切片。类似于数组的slice方法。

预先定义好单个切片大小，将文件切分成一个个切片，然后借助http的可并发性，同时上传多个切片，这样从原本传一个大文件，就变成了并发传多个小的文件切片，可以大大减少上传时间。

另外由于是并发，传输到服务端的顺序可能会发生变化，因此我们还需要给每个切片记录顺序。

```javascript
let arr = [1,2,3,4,5,6,7,8,9,10];
const Size = 3;  // 按照多长切割
function slicing(chunkList,size = Size){
  let cur = 0;
  const fileChunkList = [];
  while(cur < chunkList.length){
    fileChunkList.push(arr.slice(cur,cur+size))
    cur = cur+size;
  }
  return fileChunkList;
} 
```

### 后端

服务端负责接受前端传输的切片，并在接收到所有切片后合并所有切片

引申两个问题：
- 1. 何时合并切片，即切片什么时候传输完成
- 2. 如何合并

第一个问题需要前端配合：前端在每个切片中都携带切片最大数量的信息，当服务端接收到这个数量的切片是自动合并，或者也可以额外发一个请求，主动通知服务端进行切片的合并

第二个问题：具体如何合并切片呢？这里可以使用nodejs的读写流（readStream/writeStream），将所有切片的流按照顺序传输到最终的文件的流里面