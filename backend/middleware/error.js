const errorHandler = (err, req, res, next) => {
  // ステータスコード（デフォルトは500）
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // エラーレスポンス
  res.status(statusCode);
  
  // レスポンスJSON
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { errorHandler };