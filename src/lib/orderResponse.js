export function isValidOrderResponse(data) {
  return (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    data.success === true &&
    typeof data.order_id === "string" &&
    data.order_id.trim().length > 0 &&
    (
      (typeof data.order_number === "number" &&
        Number.isInteger(data.order_number) &&
        data.order_number > 0) ||
      (typeof data.order_number === "string" &&
        data.order_number.trim().length > 0)
    ) &&
    data.total !== null &&
    data.total !== undefined &&
    data.total !== "" &&
    Number.isFinite(Number(data.total)) &&
    Number(data.total) >= 0
  );
}
