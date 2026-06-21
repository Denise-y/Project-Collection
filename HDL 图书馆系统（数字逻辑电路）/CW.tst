load CW.hdl,
output-file CW.out,
compare-to CW.cmp,
output-list time%S1.4.1 inBookID%D3.6.3 inBookNum%D3.6.3 inBookPri%D3.6.3 load%B3.1.3 store%B3.1.3 address%D3.1.3 load0%B3.1.3 load1%B3.1.3 load2%B3.1.3 load3%B3.1.3 load4%B3.1.3 load5%B3.1.3 load6%B3.1.3 load7%B3.1.3 outBookID%D3.6.3 outBookNum%D3.6.3 outBookPri%D3.6.3 outTotalVal%D3.6.3;

set inBookID 10001,
set inBookNum 3,
set inBookPri 29,
set load 1,
tick,
output;

set load 0,
set store 1,
set address 0,
tock,
output;

tick,
output;
tock,
output;

set inBookID 10002,
set inBookNum 5,
set inBookPri 19,
set load 1,
set store 0,
tick,
output;

set load 0,
set store 1,
set address 1,
tock,
output;

tick,
output;
tock,
output;

set inBookID 10003,
set inBookNum 2,
set inBookPri 99,
set load 1,
set store 0,
tick,
output;

set load 0,
set store 1,
set address 2,
tock,
output;

tick,
output;
tock,
output;

set inBookID 0,
set inBookNum 0,
set inBookPri 0,
set load 0,
set store 0,
set address 0,
tick,
output;

set load 1,
set store 0,
set load0 1,
set load1 0,
set address 0,
tock,
output;
tick,
output;

set load0 0,
set load1 1,
set address 1,
tock,
output;
tick,
output;

set load1 0,
set load2 1,
set address 2,
tock,
output;
tick,
output;

tock,
output;
tick,
output;