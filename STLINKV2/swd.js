// SWD protocol implementation for STLINKV2 clone dongle
// uses pins B13,B14 for SWDCLK, SWDIO

const AP_CSW = 0x00;
const AP_TAR = 0x04;
const AP_DRW = 0x0c;
const AP_BD0 = 0x10;
const AP_BD1 = 0x14;
const AP_BD2 = 0x18;
const AP_BD3 = 0x1c;
const AP_DBGDRAR = 0xf8;
const AP_IDR = 0xfc;

const DP_IDCODE = 0x00; // R
const DP_ABORT = 0x00; // W
const DP_CTRLSTAT = 0x04; // RW
const DP_RESEND = 0x08; // R
const DP_SELECT = 0x08; // W
const DP_RDBUFF = 0x0c; // R


var SWDCLK;// = B13;
var SWDIO;// = B14;
var swdSPI;
function swd_setup(clkPin, dioPin)
{
  SWDCLK=clkPin;
  SWDIO=dioPin;
  swdSPI=new SPI();
  swdSPI.setup({sck:SWDCLK,miso:SWDIO,order:"msb",mode:2,bits:8});
  //pinMode(SWDCLK, OUTPUT);
  digitalWrite(SWDCLK,1);
  swd_mode(0);
}

var parity32;
var swdreq;
var rbitswap;
(function(){
  var bin=atob("QwhAAAPwVTMA8KowGEODCIAAAPDMMAPwMzMDQxgJGwED8PAzAPAPMBhDcEfDEIPqkANAABC1A/ABA4HqAgQA8BgAY0BA6oIAQOpDEEDqQQBg8H4AwLIQvYOyg+oQQMOyg+oQIwPwDwCA6hMTA/ADAIDqkwAA8AEDg+pQAHBHAAA=");
    rbitswap=E.nativeCall(1, "int(int)", bin);
    swdreq=E.nativeCall(45, "int(int,bool,bool)", bin);
    parity32=E.nativeCall(89, "int(int)", bin);
})();
/*
var c=E.compiledC(`
// int swdreq(int,bool,bool)
// int parity32(int)
// int rbitswap(int)

typedef unsigned int uint32_t;
typedef unsigned char uint8_t;

// compute parity bit
bool parity32(uint32_t val){
  val = (val & 0xFFFF) ^ (val >> 16);
  val = (val & 0xFF) ^ (val >> 8);
  val = (val & 0xF) ^ (val >> 4);
  val = (val & 0x3) ^ (val >> 2);
  val = (val & 0x1) ^ (val >> 1);
  return val;
}

//create SWD request byte
uint8_t swdreq(uint8_t regAddr, bool APorDP, bool RorW){
  bool parity = APorDP ^ RorW ^ ((regAddr >> 2) & 1) ^ ((regAddr >> 3) & 1);
  uint8_t req = (1 << 0) | (APorDP << 1) | (RorW << 2) | ((regAddr & 0xC) << 1) | (parity << 5) | (1 << 7);
  return req;
}

// swap bit order MSB to LSB and reverse endianness
uint32_t rbitswap(uint32_t x)
{
    x = (((x & 0xaaaaaaaa) >> 1) | ((x & 0x55555555) << 1));
    x = (((x & 0xcccccccc) >> 2) | ((x & 0x33333333) << 2));
    return (((x & 0xf0f0f0f0) >> 4) | ((x & 0x0f0f0f0f) << 4));
}
`);
*/



var is_connected=false;
var muted=0;

function nrf_begin()
{
  var idcode = swd_init();
  if (idcode == 0x2ba01477)
  { //if core id is readable the connection is working
    dap_power_on();
    is_connected = true;
    if (nrf_read_lock_state())
    { //nRF is unlocked so we can talk to the debugging interface
      //nrf_read_ficr();
    }
  }
  else
  {
    is_connected = false;
  }
  return idcode;
}


dapBank=0;
dapAP=0;
function dap_select(ap, bank){
  dapAP=(ap|0)&255;
  dapBank=(bank|0)&15;
  DP_Write(DP_SELECT,((dapAP<<24)|(dapBank<<4)>>>0)); //Select AP
}

const AP_NRF_APPROTECTSTATUS = 0x0c;
function nrf_read_lock_state()
{
  dap_select(1);
  var temp = dap_read(AP_NRF_APPROTECTSTATUS);
  dap_select(0);
  return temp & 1;
}

function dap_read(regAddr)
{
  if (regAddr>>4 != dapBank) dap_select(dapAP,regAddr>>4);
  var temp = AP_Read(regAddr&15);
  temp = DP_Read(DP_RDBUFF);
  if (temp==null) dap_handle_fault("dap_read");
  //else print("Read reg: 0x"+regAddr.toString(16)+" : 0x"+temp.toString(16));
  return temp;
}

function dap_write(regAddr, value)
{
  if (regAddr>>4 != dapBank) dap_select(dapAP,regAddr>>4);
  var temp = AP_Write(regAddr&15, value);
  temp = DP_Read(DP_RDBUFF);
  if (temp==null) return dap_handle_fault("dap_write");
  //else print("Write reg: 0x"+regAddr.toString(16)+" : 0x"+value.toString(16));
  return true;
}

function dap_handle_fault(msg){
  if (swdACK==1) return true;
  if (swdACK==4){ // FAULT
    DP_Write(DP_ABORT, 0x1e);
    print(msg,"SWD FAULT, CTRLSTAT="+DP_Read(DP_CTRLSTAT).toString(16));
  }
  else if (swdACK==2){ // TIMEOUT
    print(msg,"SWD TIMEOUT, CTRLSTAT="+DP_Read(DP_CTRLSTAT).toString(16));
  } else {
    print(msg,"SWD ACK="+swdACK+", no respone?");
  }
  return false;
}

function dap_poweroff(){
  DP_Write(DP_ABORT, 0x1e);
  DP_Write(DP_CTRLSTAT,0);
}

function dap_poweron()
{
  DP_Write(DP_ABORT, 0x1e);
  DP_Write(DP_CTRLSTAT, 0x50000000); // powerup system and debug domain
  var retries=3; while(retries--) if (DP_Read(DP_CTRLSTAT)>>>28 == 0xF) break;
  if (retries<1) return false;
  dap_write(AP_CSW, 0x23000002); // 32 bit read, no increment
  return true;
}

function readmem(addr,len,size, buff){
  if(!buff||buff.length!=len) buff=Uint32Array(len);
  if(!size) size=4;
  if(size==4) dap_write(AP_CSW, 0x23000012); //32bit with increment
  else if (size==2)dap_write(AP_CSW, 0x23000011); //16bit TAR increment
  else if (size==1)dap_write(AP_CSW, 0x23000010); //8bit TAR increment
  else return null;
  if (len<1) return null;
  if (!AP_Write(AP_TAR, addr)) return null;
  AP_Read(AP_DRW);//AP reads are delayed by one
  var val;var idx=0;
  while(--len>0){
    val=AP_Read(AP_DRW);
    if(swdACK!=1)return dap_handle_fault();
    buff[idx++]=val;
    if(!muted) print("0x"+addr.toString(16)+": "+val.toString(16));addr+=size;
  }
  val=DP_Read(DP_RDBUFF);buff[idx]=val; // last delayed value
  if(!muted) print("0x"+addr.toString(16)+": "+val.toString(16));
  return buff;
}

function readmem32(address)
{
  var val = 0;
  if (!dap_write(AP_TAR, address)) return null;
  AP_Read(AP_DRW); // schedule read
  val=DP_Read(DP_RDBUFF);
  if (muted) return val;
  print("Read memory: 0x"+address.toString(16)+" : 0x"+val.toString(16));
  return val;
}

function writemem32(address, value)
{
  var temp = 0;
  if (!dap_write(AP_TAR, address)) return null;
  AP_Write(AP_DRW, value);
  temp=DP_Read(DP_RDBUFF);
  if (muted) return temp!=null;
  if (!muted) print("Write memory: 0x"+address.toString(16)+" : 0x"+value.toString(16));
  return temp!=null;
}


function swd_init(jtag2swd)
{ //Returns the ID
  if(!(SWDCLK && SWDIO)) {print("setup pins via swd_setup(clkPin,dioPin)!");return null;}
  if (jtag2swd){
    swd_write(0xffffffff, 32);
    swd_write(0xffffffff, 32);
    swd_write(0xe79e, 16); // JTAG to SWD 0x79e7
  }
  swd_write(0xffffffff, 32);
  swd_write(0xffffffff, 32);
  swd_write(0, 32);
  swd_write(0, 32);
  return DP_Read(DP_IDCODE);
}

function AP_Write(regAddr, data)
{
  var retry = 15;
  while (retry--)
  {
    var res = swd_tran(1, 0, regAddr, data);
    if (res != null)
      return true;
    if (swdACK!=2) return null; // don't retry if not WAIT
    if (!muted) print("AP_Write retrying");
  }
  DP_Write(DP_ABORT,1);//still waiting, abort
  return false;
}

// send AP read request
// AP reads are 'posted' = real data is in next AP read or DP RDBUFF read
function AP_Read(regAddr)
{
  var retry = 15;
  while (retry--)
  {
    var data = swd_tran(1,1,regAddr);
    if (data != null)
      return data;
    if (swdACK!=2) return null; // don't retry if not WAIT
    if (!muted) print("AP_Read","0x"+regAddr.toString(16),"retrying");
  }
  DP_Write(DP_ABORT,1);//still waiting, abort
  return null;
}


// write DP register
function DP_Write(regAddr, data)
{
  var retry = 15;
  while (retry--)
  {
    var res = swd_tran(0,0,regAddr,data);
    if (res != null)
      return true;
    if (swdACK!=2) return null; // don't retry if not WAIT
    if (!muted) print("DP_Write retrying");
  }
  DP_Write(DP_ABORT,1);//still waiting, abort
  return false;
}

// read DP register
function DP_Read(regAddr)
{
  var retry = 15;
  while (retry--)
  {
    var data = swd_tran(0,1,regAddr);
    if (data != null)
      return data;
    if (swdACK!=2) return null; // don't retry if not WAIT
    if (!muted) print("DP_Read","0x"+regAddr.toString(16),"retrying");
  }
  DP_Write(DP_ABORT,1);//still waiting, abort
  return null;
}

var swdACK=0; // 1 OK, 2 WAIT, 4 FAULT
//32bit SWD transaction
function swd_tran(APorDP, RorW,regAddr,u32data)
{
//  var parity = APorDP ^ RorW ^ ((regAddr >> 2) & 1) ^ ((regAddr >> 3) & 1);
//  var request = (1 << 0) | (APorDP << 1) | (RorW << 2) | ((regAddr & 0xC) << 1) | (parity << 5) | (1 << 7);
  swd_write(swdreq(regAddr,APorDP, RorW), 8);
  swdACK=swd_read(3);
  if (swdACK == 1) // OK
  {
    if (RorW)
    { // Reading 32 bits from SWD
      u32data = swd_read(32);
      if (swd_read(1) == parity32(u32data))
      {
        swd_write(0, 1);
        return u32data;
      }else print("got data 0x"+u32data.toString(16));
    }
    else
    { // Writing 32 bits to SWD
      swd_write(u32data, 32);
      swd_write(parity32(u32data), 1);
      swd_write(0, 1);
      return true;
    }
  }
  swd_write(0, 32);//If Overrun Detection is enabled then a data phase is required on FAULT or WAIT
  return null;
}


/*
function parity32(uint32)
{
  uint32 = (uint32 & 0xFFFF) ^ (uint32 >>> 16);
  uint32 = (uint32 & 0xFF) ^ (uint32 >> 8);
  uint32 = (uint32 & 0xF) ^ (uint32 >> 4);
  uint32 = (uint32 & 0x3) ^ (uint32 >> 2);
  uint32 = (uint32 & 0x1) ^ (uint32 >> 1);
  return uint32;
}
*/

var swdMode; // SWDIO pin mode, 1 = Write 0 = Read
const OUTPUT = "output";
const INPUT_PULLUP = "input_pullup";
const HIGH = 1;
const LOW = 0;

// write bits  in LSB order
function swd_write(data, bits)
{
  if (swdMode != 1) swd_mode(1);
  if (bits==8) shiftOut(SWDIO,{clk:SWDCLK,repeat:8},[data]);
  else if (bits==32) shiftOut(SWDIO,{clk:SWDCLK,repeat:8},[data,data>>8,data>>16,data>>>24]);
  else while (bits--)
  {
    digitalWrite(SWDIO, data & 1);
    //digitalPulse(SWDCLK,1,1);
    digitalWrite(SWDCLK, LOW);
    //delayus(2);
    digitalWrite(SWDCLK, HIGH);
    data >>>= 1;
    //delayus(2);
  }
}

// read bits in LSB order
function swd_read(bits)
{
  var data = 0;
  var input_bit = 1;
  if (swdMode != 0) swd_mode(0);
  if (bits==32 && swdSPI){var a=swdSPI.send(Uint8Array(4));data=rbitswap(Uint32Array(a.buffer)[0]);} else
  while (bits--)
  {
    if (digitalRead(SWDIO))
    {
      data |= input_bit;
    }
    digitalWrite(SWDCLK, LOW);
    //delayus(2);
    input_bit <<= 1;
    digitalWrite(SWDCLK, HIGH);
    //delayus(2);
  }
  return data>>>0; //make unsigned
}

// change SWDIO pin mode
function swd_mode(WorR)
{ //1 = Write 0 = Read
  if (WorR == swdMode) return; // nothing to do
  if (!WorR){
    //digitalWrite(SWDIO, HIGH); // help with pull up
    pinMode(SWDIO, INPUT_PULLUP);
  }
  digitalWrite(SWDCLK, LOW);
  //delayus(2);
  digitalWrite(SWDCLK, HIGH);
  //delayus(2);
  if (WorR)
    pinMode(SWDIO, OUTPUT);
  swdMode = WorR;
}
