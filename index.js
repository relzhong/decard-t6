const ffi = require('ffi');
const ref = require('ref');
const path = require('path');
const hardware = {};
const stack = require('callsite');

function hazardous(location) {
  const electronRegex = /[\\/]electron\.asar[\\/]/;
  const asarRegex = /^(?:^\\\\\?\\)?(.*\.asar)[\\/](.*)/;
  /* convert path when use electron asar unpack
   */
  if (!path.isAbsolute(location)) {
    return location;
  }

  if (electronRegex.test(location)) {
    return location;
  }

  const matches = asarRegex.exec(location);
  if (!matches || matches.length !== 3) {
    return location;
  }

  /* Skip monkey patching when an electron method is in the callstack. */
  const skip = stack().some(site => {
    const siteFile = site.getFileName();
    return /^ELECTRON_ASAR/.test(siteFile) || electronRegex.test(siteFile);
  });

  return skip ? location : location.replace(/\.asar([\\/])/, '.asar.unpacked$1');
}


const libdecard = ffi.Library(hazardous(path.join(__dirname, './lib/dcic32')), {
  IC_Status: [ 'int', [ 'pointer' ]],
  IC_Down: [ 'int', [ 'pointer' ]],
  IC_InitComm: [ 'pointer', [ 'int' ]],
  IC_ExitComm: [ 'int', [ 'pointer' ]],
  IC_InitType: [ 'int', [ 'pointer', 'int' ]],
  IC_Read: [ 'int', [ 'pointer', 'int', 'int', 'pointer' ]],
  IC_Write: [ 'int', [ 'pointer', 'int', 'int', 'string' ]],
  IC_Erase: [ 'int', [ 'pointer', 'int', 'int' ]],
  IC_Read_Float: [ 'int', [ 'pointer', 'int', 'pointer' ]],
  IC_Write_Float: [ 'int', [ 'pointer', 'int', 'float' ]],
  IC_Read_Int: [ 'int', [ 'pointer', 'int', 'pointer' ]],
  IC_Write_Int: [ 'int', [ 'pointer', 'int', 'int' ]],
  IC_Encrypt: [ 'int', [ 'string', 'string', 'int', 'pointer' ]],
  IC_Decrypt: [ 'int', [ 'string', 'string', 'int', 'pointer' ]],
  IC_CheckCard: [ 'int', [ 'pointer' ]],
  IC_DevBeep: [ 'int', [ 'pointer', 'int' ]],
  IC_ReadVer: [ 'int', [ 'pointer', 'pointer' ]],
  IC_WriteDevice: [ 'int', [ 'int', 'int', 'int', 'pointer' ]],
  IC_ReadDevice: [ 'int', [ 'int', 'int', 'int', 'pointer' ]],
  IC_InitCommAdvanced: [ 'pointer', [ 'int' ]],
  asc2hex: [ 'int', [ 'string', 'pointer', 'int' ]],
  hex2asc: [ 'int', [ 'string', 'pointer', 'int' ]],
  IC_SetCommTimeout: [ 'int', [ 'int', 'int' ]],
  IC_SetUsbTimeout: [ 'int', [ 'int' ]],
  IC_CpuReset: [ 'int', [ 'pointer', 'pointer', 'pointer' ]],
  IC_CpuReset_Hex: [ 'int', [ 'pointer', 'pointer', 'pointer' ]],
  IC_CpuApdu: [ 'int', [ 'pointer', 'int', 'string', 'pointer', 'pointer' ]],
  IC_CpuApdu_Hex: [ 'int', [ 'pointer', 'int', 'string', 'pointer', 'pointer' ]],
  IC_CpuApduSource: [ 'int', [ 'pointer', 'int', 'string', 'pointer', 'pointer' ]],
  IC_CpuApduSource_Hex: [ 'int', [ 'pointer', 'int', 'string', 'pointer', 'pointer' ]],
  IC_CpuGetProtocol: [ 'int', [ 'pointer' ]],
  IC_CpuSetProtocol: [ 'int', [ 'pointer', 'char' ]],
  IC_Check_CPU: [ 'int', [ 'pointer' ]],
  IC_SetCpuPara: [ 'int', [ 'pointer', 'char', 'char', 'char' ]],
  IC_CpuApduEXT: [ 'int', [ 'pointer', 'int', 'string', 'pointer', 'pointer' ]],
  IC_CpuApduEXT_Hex: [ 'int', [ 'pointer', 'int', 'string', 'pointer', 'pointer' ]],
  IC_CpuApduSourceEXT: [ 'int', [ 'pointer', 'int', 'string', 'pointer', 'pointer' ]],
  IC_CpuApduSourceEXT_Hex: [ 'int', [ 'pointer', 'int', 'string', 'pointer', 'pointer' ]],
  IC_CpuColdReset: [ 'int', [ 'pointer', 'pointer', 'pointer' ]],
  IC_CpuColdReset_Hex: [ 'int', [ 'pointer', 'pointer', 'pointer' ]],
  IC_CpuHotReset: [ 'int', [ 'pointer', 'pointer', 'pointer' ]],
  IC_CpuHotReset_Hex: [ 'int', [ 'pointer', 'pointer', 'pointer' ]],
});

hardware.IC_InitComm = port => {
  try {
    const handle = libdecard.IC_InitComm(port);
    if (ref.isNull(handle)) {
      return { error: -1 };
    }
    return { error: 0, data: { handle } };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_ExitComm = handle => {
  try {
    const res = libdecard.IC_ExitComm(handle);
    if (res === 0) {
      return { error: 0 };
    }
    return { error: -1 };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_Status = handle => {
  try {
    const res = libdecard.IC_Status(handle);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_Down = handle => {
  try {
    const res = libdecard.IC_Down(handle);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_InitType = (handle, typeNo) => {
  try {
    const res = libdecard.IC_InitType(handle, typeNo);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_Read = (handle, offset, len) => {
  try {
    const DataBuffer = ref.alloc(ref.types.uchar);
    const res = libdecard.IC_Read(handle, offset, len, DataBuffer);
    if (res === 0) {
      const dataBuffer = DataBuffer.deref();
      return { error: 0, data: { dataBuffer } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_Write = (handle, offset, len, dataBuffer) => {
  try {
    const res = libdecard.IC_Write(handle, offset, len, dataBuffer);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_Erase = (handle, offset, len) => {
  try {
    const res = libdecard.IC_Erase(handle, offset, len);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_Read_Float = (handle, offset) => {
  try {
    const data = ref.alloc(ref.types.float);
    const res = libdecard.IC_Read_Float(handle, offset, data);
    if (res === 0) {
      const fdata = data.deref();
      return { error: 0, data: { fdata } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_Write_Float = (handle, offset, fdata) => {
  try {
    const res = libdecard.IC_Write_Float(handle, offset, fdata);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_Encrypt = (key, ptrsource, msglen) => {
  try {
    const data = ref.alloc(ref.types.char);
    const res = libdecard.IC_Encrypt(key, ptrsource, msglen, data);
    if (res === 0) {
      const ptrdest = data.deref();
      return { error: 0, data: { ptrdest } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_Decrypt = (key, ptrsource, msglen) => {
  try {
    const data = ref.alloc(ref.types.char);
    const res = libdecard.IC_Decrypt(key, ptrsource, msglen, data);
    if (res === 0) {
      const ptrdest = data.deref();
      return { error: 0, data: { ptrdest } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_Read_Int = (handle, offset) => {
  try {
    const data = ref.alloc(ref.types.int);
    const res = libdecard.IC_Read_Int(handle, offset, data);
    if (res === 0) {
      const idata = data.deref();
      return { error: 0, data: { idata } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_Write_Int = (handle, offset, idata) => {
  try {
    const res = libdecard.IC_Write_Int(handle, offset, idata);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CheckCard = handle => {
  try {
    const res = libdecard.IC_CheckCard(handle);
    if (res > 0) {
      return { error: 0, data: { type: res } };
    }
    return { error: -1 };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_DevBeep = (handle, time) => {
  try {
    const res = libdecard.IC_DevBeep(handle, time);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_ReadVer = handle => {
  try {
    const data = ref.alloc(ref.types.char);
    const res = libdecard.IC_ReadVer(handle, data);
    if (res === 0) {
      const data_buff = data.deref();
      return { error: 0, data: { data_buff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_WriteDevice = (handle, offset, length, buffer) => {
  try {
    const res = libdecard.IC_WriteDevice(handle, offset, length, buffer);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_ReadDevice = (handle, offset, length) => {
  try {
    const data = ref.alloc(ref.types.char);
    const res = libdecard.IC_ReadDevice(handle, offset, length, data);
    if (res === 0) {
      const buffer = data.deref();
      return { error: 0, data: { buffer } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_InitCommAdvanced = port => {
  try {
    const handle = libdecard.IC_InitCommAdvanced(port);
    if (ref.isNull(handle)) {
      return { error: -1 };
    }
    return { error: 0, data: { handle } };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.asc2hex = (strasc, length) => {
  try {
    const data = ref.alloc(ref.types.char);
    const res = libdecard.asc2hex(strasc, data, length);
    const strhex = data.deref();
    if (res === 0) {
      return { error: 0, data: { strhex } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.hex2asc = (strhex, length) => {
  try {
    const data = ref.alloc(ref.types.char);
    const res = libdecard.hex2asc(strhex, data, length);
    const strasc = data.deref();
    if (res === 0) {
      return { error: 0, data: { strasc } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_SetCommTimeout = (lTime_ms, sTime_ms) => {
  try {
    const res = libdecard.IC_SetCommTimeout(lTime_ms, sTime_ms);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_SetUsbTimeout = ntimes => {
  try {
    const res = libdecard.IC_SetUsbTimeout(ntimes);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuReset = handle => {
  try {
    const data = new Buffer(64 * ref.types.uchar.size);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuReset(handle, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuReset_Hex = handle => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuReset_Hex(handle, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuApdu = (handle, sbuff) => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuApdu(handle, sbuff.length, sbuff, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuApdu_Hex = (handle, sbuff) => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuApdu_Hex(handle, sbuff.length / 2, sbuff, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen * 2).toString();
      if (rbuff.indexOf('61') === 0) {
        return hardware.IC_CpuApdu_Hex(handle, '00C00000' + rbuff.split('61')[1]);
      }
      if (rbuff.indexOf('6C') === 0) {
        return hardware.IC_CpuApdu_Hex(handle, sbuff.slice(0, -2) + rbuff.split('6C')[1]);
      }
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuApduSource = (handle, sbuff) => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuApduSource(handle, sbuff.length, sbuff, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuApduSource_Hex = (handle, sbuff) => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuApduSource_Hex(handle, sbuff.length, sbuff, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuGetProtocol = handle => {
  try {
    const res = libdecard.IC_CpuGetProtocol(handle);
    if (res >= 0) {
      return { error: 0, data: { type: res } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuSetProtocol = (handle, prtol) => {
  try {
    const res = libdecard.IC_CpuSetProtocol(handle, prtol);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_Check_CPU = handle => {
  try {
    const res = libdecard.IC_Check_CPU(handle);
    if (res >= 0) {
      return { error: 0, data: { type: res } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_SetCpuPara = (handle, cputype, cpupro, cpuetu) => {
  try {
    const res = libdecard.IC_SetCpuPara(handle, cputype, cpupro, cpuetu);
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuApduEXT = (handle, sbuff) => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuApduEXT(handle, sbuff.length, sbuff, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuApduEXT_Hex = (handle, sbuff) => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuApduEXT_Hex(handle, sbuff.length / 2, sbuff, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuApduSourceEXT = (handle, sbuff) => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuApduSourceEXT(handle, sbuff.length, sbuff, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuApduSourceEXT_Hex = (handle, sbuff) => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuApduSourceEXT_Hex(handle, sbuff.length, sbuff, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuColdReset = handle => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuColdReset(handle, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuColdReset_Hex = handle => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuColdReset_Hex(handle, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuHotReset = handle => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuHotReset(handle, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};

hardware.IC_CpuHotReset_Hex = handle => {
  try {
    const data = ref.alloc(ref.types.char);
    const len = ref.alloc(ref.types.char);
    const res = libdecard.IC_CpuHotReset_Hex(handle, len, data);
    if (res === 0) {
      const rlen = len.deref();
      const rbuff = ref.reinterpret(data, rlen);
      return { error: 0, data: { rbuff } };
    }
    return { error: res };
  } catch (e) {
    return { error: -1 };
  }
};


module.exports = hardware;
