// "use client";

// export default function Footer() {
//   const currentYear = new Date().getFullYear(); // Get the current year

//   return (
//     <footer className=" bg-[#165b8c] mt-auto">
//       <div className="max-w-screen-xl px-2 pb-4 mx-auto sm:px-6 lg:px-8 lg:pt-10">

//         <div className="pt-2 border-t border-gray-800">
//           <div className="text-center sm:flex sm:justify-between sm:text-left">
//             <p className="text-sm text-gray-400">
//               <span className="block sm:inline">All rights reserved.</span>

//               <a
//                 className="inline-block text-teal-500 underline transition hover:text-teal-500/75"
//                 href="/"
//               >
//                 Terms & Conditions
//               </a>

//               <span>&middot;</span>

//               <a
//                 className="inline-block text-teal-500 underline transition hover:text-teal-500/75"
//                 href="/"
//               >
//                 Privacy Policy
//               </a>
//             </p>

//             <p className="mt-4 text-sm text-gray-500 sm:order-first sm:mt-0">
//               &copy; {currentYear} Massive Group
//             </p>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// };


"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    // <footer className="bg-[#165b8c] mt-auto">
    <footer className="fixed bottom-0 left-0 right-0 bg-[#165b8c] z-50">
      <div className="max-w-screen-xl px-2 py-2 mx-auto">
        <div className="text-center text-xs text-gray-400">
          <span className="block sm:inline">
            &copy; {currentYear} Massive Group • All rights reserved.{" "}
          </span>
          <a className="underline hover:text-teal-300 transition" href="/">
            Terms
          </a>
          <span> • </span>
          <a className="underline hover:text-teal-300 transition" href="/">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}