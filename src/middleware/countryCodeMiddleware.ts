import geoip from "geoip-lite";
import { NextFunction, Request, Response } from "express";
import countries from "i18n-iso-countries";
import { parsePhoneNumberFromString,getExampleNumber,CountryCode } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
const countryCodesList = require("country-codes-list");

// Register English locale
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

export interface CountryCodeRequest extends Request {
  countryCode?: string;   // e.g. +91
  countryISO?: string;    // e.g. IN
  countryName?: string;   // e.g. India
}

const callingCodes = countryCodesList.customList(
  "countryCode",
  "{countryCallingCode}"
);

export const detectCountryCode = (
  req: CountryCodeRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";

    // 🧠 Localhost or internal IP handling
    if (ip === "::1" || ip.startsWith("127.") || ip.includes("192.168")) {
      const testCountryISO = "US"; // Change here for testing

      const testIPs: Record<string, string> = {
        IN: "49.207.180.1",    // India
        US: "8.8.8.8",         // USA
        GB: "81.2.69.142",     // UK
        AU: "1.1.1.1",         // Australia
        FR: "51.15.0.1",       // France
        DE: "139.162.130.187", // Germany
        JP: "210.140.92.187",  // Japan
        CN: "61.135.169.121",  // China
        AE: "94.200.1.160",    // UAE
      };

      ip = testIPs[testCountryISO] || testIPs["IN"];
    }

    const geo = geoip.lookup(ip);
    const countryISO = geo?.country || "IN";
    const callingCode = callingCodes[countryISO];
    const countryCode = callingCode ? `+${callingCode}` : "+91";
    const countryName = countries.getName(countryISO, "en") || "India";

    req.countryISO = countryISO;
    req.countryCode = countryCode;
    req.countryName = countryName;

    // 📞 Mobile number validation if provided
    const mobile = req.body.mobileNumber;

    if (mobile) {
      const parsed = parsePhoneNumberFromString(
        `${countryCode}${mobile}`
      );

      if (!parsed || !parsed.isValid()) {
        return res.status(400).json({
          success: false,
          message: `Invalid mobile number format for ${countryName}.`,
          expectedExample: getExampleNumber(countryISO as CountryCode,examples)
        });
      }

      // Optional: send back expected length
      const length = parsed.nationalNumber.length;

      req.body.mobileNumber = parsed.nationalNumber; // clean number if needed
      req.body.mobileLength = length;
    }

    next();
  } catch (error: any) {
    console.error("Country detection error:", error.message);
    req.countryISO = "IN";
    req.countryCode = "+91";
    req.countryName = "India";
    next();
  }
};
