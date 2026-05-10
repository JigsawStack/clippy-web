"use client";

import { useState } from "react";
import Link from "next/link";

type Section = "shipping" | "payment" | "review";

export default function CheckoutPage() {
  const [section, setSection] = useState<Section>("shipping");
  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });
  const [payment, setPayment] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    nameOnCard: "",
  });

  const sections: { key: Section; label: string; step: number }[] = [
    { key: "shipping", label: "Shipping", step: 1 },
    { key: "payment", label: "Payment", step: 2 },
    { key: "review", label: "Review", step: 3 },
  ];

  const currentStep = sections.findIndex((s) => s.key === section);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          &larr; Back to demos
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Checkout</h1>

        <div className="flex items-center mb-8">
          {sections.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <button
                onClick={() => setSection(s.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  section === s.key
                    ? "bg-indigo-600 text-white"
                    : i <= currentStep
                    ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    section === s.key
                      ? "bg-white text-indigo-600"
                      : i <= currentStep
                      ? "bg-indigo-200 text-indigo-800"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {s.step}
                </span>
                {s.label}
              </button>
              {i < sections.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    i < currentStep ? "bg-indigo-300" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {section === "shipping" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Shipping Address</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ship-first" className="block text-sm font-medium text-slate-700 mb-1">
                    First name
                  </label>
                  <input
                    id="ship-first"
                    type="text"
                    value={shipping.firstName}
                    onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="ship-last" className="block text-sm font-medium text-slate-700 mb-1">
                    Last name
                  </label>
                  <input
                    id="ship-last"
                    type="text"
                    value={shipping.lastName}
                    onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="ship-address" className="block text-sm font-medium text-slate-700 mb-1">
                  Street address
                </label>
                <input
                  id="ship-address"
                  type="text"
                  value={shipping.address}
                  onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="ship-city" className="block text-sm font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    id="ship-city"
                    type="text"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="ship-state" className="block text-sm font-medium text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    id="ship-state"
                    type="text"
                    value={shipping.state}
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="ship-zip" className="block text-sm font-medium text-slate-700 mb-1">
                    ZIP code
                  </label>
                  <input
                    id="ship-zip"
                    type="text"
                    value={shipping.zip}
                    onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="ship-country" className="block text-sm font-medium text-slate-700 mb-1">
                  Country
                </label>
                <select
                  id="ship-country"
                  value={shipping.country}
                  onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                >
                  <option>United States</option>
                  <option>Canada</option>
                  <option>United Kingdom</option>
                  <option>Australia</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSection("payment")}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Continue to payment
                </button>
              </div>
            </div>
          )}

          {section === "payment" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Payment Details</h2>
              <div>
                <label htmlFor="card-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Name on card
                </label>
                <input
                  id="card-name"
                  type="text"
                  value={payment.nameOnCard}
                  onChange={(e) => setPayment({ ...payment, nameOnCard: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="card-number" className="block text-sm font-medium text-slate-700 mb-1">
                  Card number
                </label>
                <input
                  id="card-number"
                  type="text"
                  value={payment.cardNumber}
                  onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="card-expiry" className="block text-sm font-medium text-slate-700 mb-1">
                    Expiry date
                  </label>
                  <input
                    id="card-expiry"
                    type="text"
                    value={payment.expiry}
                    onChange={(e) => setPayment({ ...payment, expiry: e.target.value })}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="card-cvv" className="block text-sm font-medium text-slate-700 mb-1">
                    CVV
                  </label>
                  <input
                    id="card-cvv"
                    type="text"
                    value={payment.cvv}
                    onChange={(e) => setPayment({ ...payment, cvv: e.target.value })}
                    placeholder="123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => setSection("shipping")}
                  className="px-6 py-2.5 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 transition font-medium text-slate-700"
                >
                  Back
                </button>
                <button
                  onClick={() => setSection("review")}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Review order
                </button>
              </div>
            </div>
          )}

          {section === "review" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Review Your Order</h2>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Shipping Address</h3>
                <p className="text-sm text-slate-600">
                  {shipping.firstName} {shipping.lastName}<br />
                  {shipping.address}<br />
                  {shipping.city}, {shipping.state} {shipping.zip}<br />
                  {shipping.country}
                </p>
                <button
                  onClick={() => setSection("shipping")}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Edit
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Payment Method</h3>
                <p className="text-sm text-slate-600">
                  {payment.nameOnCard}<br />
                  Card ending in {payment.cardNumber.slice(-4) || "****"}
                </p>
                <button
                  onClick={() => setSection("payment")}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Edit
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Widget Pro x2</span><span>$59.98</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Gadget Plus x1</span><span>$24.99</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span><span>$5.99</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-slate-900">
                    <span>Total</span><span>$90.96</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setSection("payment")}
                  className="px-6 py-2.5 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 transition font-medium text-slate-700"
                >
                  Back
                </button>
                <button
                  onClick={() => alert("Order placed! Thank you.")}
                  className="px-6 py-2.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Place order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
