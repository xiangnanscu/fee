<script setup>
import { ref, computed } from "vue";
import feeTemplate from "./fee.xlsx";
import XlsxTemplate from "xlsx-template-compact";
import fs from "file-saver";
import axios from "axios";
import Model from "@xiangnanscu/model";

const FeeItecnodel = Model.makeClass({
  tableName: "FeeItem",
  abstract: true,
  fields: {
    name: { label: "姓名" },
  },
});
const FeeModel = Model.makeClass({
  abstract: true,
  tableName: "Fee",
  fields: {
    item: { label: "条目", model: FeeItecnodel },
  },
});

const gwy = '王廷江,董茂明,项楠,肖宇,蒲洁,魏涛,龙曦'.split(',');
const sy = '杨洁,陈乾,袁良会'.split(',');
const users = {
  ...Object.fromEntries(gwy.map(e => [e.trim(), 'g'])),
  ...Object.fromEntries(sy.map(e => [e.trim(), 's']))
};

function s2ab(s) {
  var buf = new ArrayBuffer(s.length);
  var view = new Uint8Array(buf);
  for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
  return buf;
}

function templateToFile({ template, filename, table }) {
  var bin = "";
  var bytes = new Uint8Array(template);
  var length = bytes.byteLength;
  for (var i = 0; i < length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  var tbin = new XlsxTemplate(bin);
  for (const sht of tbin.sheets) {
    tbin.substitute(sht.name, table);
  }
  var data = tbin.generate();
  if (filename.slice(-5) != ".xlsx") {
    filename = filename + ".xlsx";
  }
  fs.saveAs(
    new Blob([s2ab(data)], {
      type: "application/octet-stream",
    }),
    filename
  );
}
const makeItem = () => ({
  start_year: "",
  start_month: "",
  start_day: "",
  start_address: "",
  end_year: "",
  end_month: "",
  end_day: "",
  end_address: "",
  days: 0,
  reason: "",
  bzf_bz: 0,
  bzf_je: 0,
  zf_bz: 0,
  zf_je: 0,
  ccf_lb: "",
  ccf_zs: "",
  ccf_je: "",
  zqf_days: "",
  zqf_bz: "",
  zqf_je: "",
  sf_zs: "",
  sf_je: "",
  i: "",
});

const inputValue = ref(`张三,李四|2022|7|3|江安|2022|7|3|宜宾|1|公招体检`);

const getFeeStandard = (address, flag) => {
  if (/^宜宾市?$/.test(address)) {
    return flag == 'g' ? { bzf_bz: 80, zf_bz: 20 } : { bzf_bz: 80, zf_bz: 40 };
  } else if (/^(叙州|翠屏|南溪|长宁|三江新|临港|高|珙|筠连|屏山|兴文)[区县]?$/.test(address)) {
    return flag == 'g' ? { bzf_bz: 80, zf_bz: 20 } : { bzf_bz: 80, zf_bz: 40 };
  } else if (/^(江安|下长|阳春|铁清|四面山|怡乐|留耕|夕佳山|大妙|仁和|大井|红桥|五矿|迎安)镇?$/.test(address)) {
    return { bzf_bz: 50, zf_bz: 0 };
  } else if (/^.+市?$/.test(address)) {
    return flag == 'g' ? { bzf_bz: 100, zf_bz: 25 } : { bzf_bz: 100, zf_bz: 50 };
  } else {
    throw `无法解析的地址${address}`;
  }
};
const parseItem = line => {
  const [nameString, ...ia] = line.split('|');
  const rawItem = makeItem();
  const item = Object.fromEntries(Object.keys(rawItem).map((e, i) => [e, ia[i] || rawItem[e]]));
  const names = nameString.split(/[,]/);
  const days = Number(item.days);
  const end_address = item.end_address;
  const bzfSet = new Set();
  const zfSet = new Set();
  for (const name of names) {
    let flag = users[name];
    if (!flag) {
      throw `找不到职工${name}`;
    }
    const { bzf_bz, zf_bz } = getFeeStandard(end_address, flag);
    item.bzf_je += bzf_bz * days;
    item.zf_je += zf_bz * days;
    bzfSet.add(bzf_bz);
    zfSet.add(zf_bz);
  }
  item.bzf_bz = Array.from(bzfSet).sort().join('/');
  item.zf_bz = Array.from(zfSet).sort().join('/');
  item.total = item.bzf_je + item.zf_je;
  item.names = names;
  item.start_date = `${item.start_year}.${item.start_month}.${item.start_day}`;
  item.end_date = item.start_year === item.end_year ? `${item.end_month}.${item.end_day}` : `${item.end_year}.${item.end_month}.${item.end_day}`;
  item.date = `${item.start_date}—${item.end_date}`;
  item.address = `${item.start_address}—${item.end_address}`;
  return item;
};

const ChineseMoneyMap = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const getCnNumberList = (acc) => {
  const cn = [];
  for (let i = 3; i > -1; i--) {
    const unit = 10 ** i;
    const n = Math.floor(acc / unit);
    cn.push(ChineseMoneyMap[n]);
    acc = acc - n * unit;
  }
  return cn;
};
async function download(event) {
  const items = [];
  for (const line of inputValue.value.split('\n')) {
    const item = parseItem(line);
    items.push(item);
  }
  const names = items.flatMap(e => e.names).filter((e, i, a) => a.indexOf(e) === i).join(',');
  const total = items.map(e => e.total).reduce((x, y) => x + y);
  const n = items.length;
  for (let i = 0; i < 6 - n; i++) {
    items.push({});
  }
  if (total > 9999) {
    throw "总金额不能大于9999元";
  }
  const cn = getCnNumberList(total);
  templateToFile({
    template: feeTemplate,
    filename: "差旅费报销明细表",
    table: {
      names,
      qian: cn[0],
      bai: cn[1],
      shi: cn[2],
      yuan: cn[3],
      jiao: "零",
      fen: "零",
      xiaoxie: total,
      t: items,
    },
  });
}
</script>

<template>
  <div style="width:980px;margin: auto;">
    <span>姓名1,姓名2|2022|7|3|江安|2022|7|3|宜宾|1|公招体检</span>
    <textarea v-model="inputValue" rows="20" class="block"></textarea>
    <button class="block" @click="download">下载</button>
  </div>
</template>

<style scoped>
a {
  color: #42b983;
}

.block {
  display: block;
  width: 100%;
}
</style>
