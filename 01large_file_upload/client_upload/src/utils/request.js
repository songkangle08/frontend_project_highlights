const baseURl = "http://localhost:5000";
export default function request({ url, method = "post", headers = {}, data }) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, baseURl + url);
    Object.keys(headers).forEach((key) => {
      xhr.setRequestHeader(key, headers[key]);
    });
    xhr.send(data);
    xhr.onload = (e) => {
      resolve({
        data: e.target.response,
      });
    };
  });
}
