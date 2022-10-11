// import { WebUSB } from 'usb';

// (async () => {
//     const customWebUSB = new WebUSB({
//         // This function can return a promise which allows a UI to be displayed if required
//         devicesFound: devices =>
//             devices.find(device => device.vendorId === 4617 && device.productId === 21441),
//     });

//     // Returns device based on injected 'devicesFound' function
//     const device = await customWebUSB.requestDevice({
//         filters: [{}],
//     });

//     if (device) {
//         console.log(device); // WebUSB device
//     }
// })();

import { WebUSB } from 'usb';
(async () => {
    const customWebUSB = new WebUSB({
        // Bypass cheking for authorised devices
        allowAllDevices: true,
    });

    // Uses blocking calls, so is async
    const allDevices = await customWebUSB.getDevices();
    const devices = allDevices.filter(
        device => device.vendorId === 4617 && device.productId === 21441,
    );

    for (const device of devices) {
        console.log(device); // WebUSB device
    }
})();
