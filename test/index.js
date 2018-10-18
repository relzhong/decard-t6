const assert = require('assert');

const libdecard = require('../index');

describe('test com port connect', () => {
  let device;
  it('should open port successfully', () => {
    const { error, data } = libdecard.IC_InitComm(100);
    assert(error === 0);
    device = data.handle;
  });
  it('should sing bee song successfully', () => {
    const res = libdecard.IC_DevBeep(device, 20);
    assert(res.error === 0);
  });
  it('should get ic status successfully', () => {
    const res = libdecard.IC_Status(device);
    assert(res.error === 0);
  });
  it('should init ic type successfully', () => {
    const res = libdecard.IC_InitType(device, 0x0c);
    assert(res.error === 0);
  });
  it('should reset cpu successfully', () => {
    const res = libdecard.IC_CpuReset_Hex(device);
    assert(res.error === 0);
  });
  it('should do apdu successfully', () => {
    const res = libdecard.IC_CpuApdu_Hex(device, '00A404000E315041592E5359532E4444463031');
    assert(res.error === 0);
  });
  it('should do apdu successfully', () => {
    const res = libdecard.IC_CpuApdu_Hex(device, '00B2010C00');
    assert(res.error === 0);
  });
  it('should cold reset cpu successfully', () => {
    const res = libdecard.IC_CpuColdReset(device);
    assert(res.error === 0);
  });
  after(() => {
    libdecard.IC_ExitComm(device);
  });
});

