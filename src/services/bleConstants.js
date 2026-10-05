// A fixed custom service so devices can recognize each other by advertisement
// alone, without any server. Characteristics carry the actual profile data,
// read over a short-lived GATT connection after discovery.
export const SERVICE_UUID = "b3a1f000-1234-4c56-9abc-1234567890ab";
export const CHAR_NAME_UUID = "b3a1f001-1234-4c56-9abc-1234567890ab";
export const CHAR_PHONE_UUID = "b3a1f002-1234-4c56-9abc-1234567890ab";
