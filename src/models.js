import axios from "axios";
import Model from "@xiangnanscu/model";

const Fee = Model.makeClass({
  tableName: "Fee",
  fields: {
    id: { primaryKey: true, type: "integer" },
    ctime: { type: "datetime", autoNowAdd: true },
    utime: { type: "datetime", autoNow: true },
    start_date: { type: "date" },
    start_address: { maxlength: 6 },
    end_date: { type: "date" },
    end_address: { maxlength: 6 },
    reason: { maxlength: 25 },
    bzf_bz: { type: "integer", default: 0 },
    bzf_je: { type: "integer", default: 0 },
    zf_bz: { type: "integer", default: 0 },
    zf_je: { type: "integer", default: 0 },
  },
});
Fee.query = async function (statement) {
  return await axios.post("https://832iyue4j2.execute-api.ap-northeast-1.amazonaws.com/default/planetscale", { statement });
};

const Comment = Model.makeClass({
  tableName: "Comment",
  fields: {
    id: { primaryKey: true, type: "integer" },
    ctime: { type: "datetime", autoNowAdd: true },
    utime: { type: "datetime", autoNow: true },
    name: { maxlength: 255 },
    content: { maxlength: 255 },

  },
});
Comment.query = async function (statement) {
  return await axios.post("https://832iyue4j2.execute-api.ap-northeast-1.amazonaws.com/default/planetscale", { statement });
};

export {
  Fee,
  Comment
};