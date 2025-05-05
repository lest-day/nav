import axios from "@/utils/request";
import fetchJsonp from "fetch-jsonp";

/**
 * 获取天气
 * https://lbs.amap.com/api/webservice/guide/api/weatherinfo
 */
// 获取高德地理位置信息
export const getAdcode = async (key) => {
  return axios({
    method: "GET",
    url: "https://restapi.amap.com/v3/ip",
    params: { key },
  });
};

// 获取高德地理天气信息
export const getWeather = async (key, city) => {
  return axios({
    method: "GET",
    url: "https://restapi.amap.com/v3/weather/weatherInfo",
    params: { key, city, extensions: "base" },
  });
};

/**
 * 获取搜索建议
 * https://suggestion.baidu.com
 * @param {String} keyWord - 搜索关键字
 */
export const getSearchSuggestions = (keyWord) => {
  return new Promise((resolve, reject) => {
      const encodedKeyword = encodeURIComponent(keyWord);
      const callbackName = `jsonp_${Date.now()}`;

      // 定义全局的 JSONP 回调函数
      window[callbackName] = (data) => {
          try {
              // 清除全局回调函数
              delete window[callbackName];
              // 移除创建的 script 标签
              const script = document.querySelector(`script[src*="${callbackName}"]`);
              if (script) {
                  document.body.removeChild(script);
              }
              // 解析并返回数据
              resolve(data.s);
          } catch (error) {
              reject(error);
          }
      };

      // 创建 script 标签并设置其 src 属性
      const script = document.createElement('script');
      script.src = `https://suggestion.baidu.com/su?wd=${encodedKeyword}&cb=${callbackName}`;
      script.onerror = () => {
          // 发生错误时，清除全局回调函数
          delete window[callbackName];
          // 移除创建的 script 标签
          const scriptToRemove = document.querySelector(`script[src*="${callbackName}"]`);
          if (scriptToRemove) {
              document.body.removeChild(scriptToRemove);
          }
          reject(new Error('JSONP 请求失败'));
      };

      // 将 script 标签添加到页面中
      document.body.appendChild(script);
  });
};