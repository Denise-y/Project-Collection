//20616309 Yushan Wang

  @R0       // X
  D=M
  @R3
  M=D     
  @R1       // Y
	D=M       
	@R4
	M=D
	@R0       // X
	D=M      
	@R1       // Y
	D=M-D    // Z
	@ODD_EVEN      //X<Y
	D;JGT
	@FIRST_SWAP    //X>Y
	D;JLT
	@EQUAL         //X=Y
	D;JEQ
(EQUAL)
	@1
	D=M
	@R2
	M=D    //Z=Y
	@SORT
	0;JMP

(FIRST_SWAP)
	@R1
	D=M
	@temp
	M=D
    
	@R0
	D=M
	@R1
	M=D

	@temp
	D=M
	@R0
	M=D


(ODD_EVEN)	
	@R0           
	D=M     
	@1
	D=D&A 
	@IS_X_EVEN          
	D;JEQ    
	@R1
	D=M   
	@1
	D=D&A   
	@IS_Y_EVEN
	D;JEQ    
	@SUM_ODD // if both odd
	0;JMP    

(IS_X_EVEN)
	@R1
	D=M 
	@1
	D=D&A    
	@IS_Y_ODD
	D;JNE    
	@SUM_EVEN   //if both even 
	0;JMP    

(IS_Y_EVEN)
	@SUM_ALL    //x is odd, y is even
	0;JMP    

(IS_Y_ODD)
	@SUM_ALL    //x is even, y is odd
	0;JMP    

(SUM_ALL)
	@R0
	D=M
	@i    
	M=D   // i = RAM[0]
	@sum  
	M=0   // sum = 0

(ALL_LOOP)
 	@i    // if i>RAM[1] goto STOP
 	D=M
 	@R1
 	D=D-M
 	@ALL_STOP 
	D;JGT
 	@i    // sum += i
 	D=M
 	@sum
 	M=D+M
 	@i    // i++
 	M=M+1 
	@ALL_LOOP // goto LOOP
 	0;JMP
(ALL_STOP)
 	@sum
 	D=M // D = sum
 	@R2
	M=D    // Z = sum
	@SORT
	0;JMP

(SUM_EVEN)
	@R0
	D=M
	@i    
	M=D   // i = RAM[0]
	@sum  
	M=0   // sum = 0

(EVEN_LOOP)
 	@i    // if i>RAM[1] goto STOP
 	D=M
 	@R1
 	D=D-M
 	@EVEN_STOP 
	D;JGT
 	@i    // sum += i
 	D=M
 	@sum
 	M=D+M
 	@2
 	D=A
 	@i    // i+2
 	M=M+D 
	@EVEN_LOOP // goto LOOP
 	0;JMP
(EVEN_STOP)
 	@sum
 	D=M // D = sum
 	@R2
	M=D    // Z = sum
	@SORT
	0;JMP


(SUM_ODD)
	@R0
	D=M
	@i    
	M=D   // i = RAM[0]
	@sum  
	M=0   // sum = 0

(ODD_LOOP)
 	@i    // if i>RAM[1] goto STOP
 	D=M
 	@R1
 	D=D-M
 	@ODD_STOP
	D;JGT
 	@i    // sum += i
 	D=M
 	@sum
 	M=D+M
 	@2
 	D=A
 	@i    // i+2
 	M=M+D 
	@ODD_LOOP // goto LOOP
 	0;JMP
(ODD_STOP)
 	@sum
 	D=M // D = sum
 	@R2
	M=D    // Z = sum
	@SORT
	0;JMP


(SORT)
	@R2
	D=M
	@SORT_ASC
	D;JGT
	@SORT_DSC
	D;JLT
	@CHECK
	0;JMP    //Z=0

(SORT_ASC)
	@R2
	D=M
	@i     //RAM[i]=-Z
	M=D-1  //exchange times
	@50
	D=A
	@i    //RAM[i]=50+Z-1 the last element
	M=M+D
(A_ASC_LOOP)
	@50
	D=A
	@j    //RAM[j]=50
	M=D
	@k    //RAM[k]=51
	M=D+1
(ASC_LOOP)
	@i    // if i=j goto STOP
	D=M
	@j
	D=M-D
	@ASC_STOP
	D;JEQ
	@j
	A=M   //50
	D=M   //RAM[50]
	@k
	A=M
	D=M-D  //RAM[50]-RAM[51]
	@ASC_NO_SWAP  //RAM[50]<RAM[51]
	D;JGE
	@ASC_SORT_SWAP
	D;JLT

(ASC_SORT_SWAP)
	@j
	A=M
	D=M
	@temp
	M=D
	  
	@k
	A=M
	D=M
	@j
	A=M
	M=D

	@temp
	D=M
	@k
	A=M
	M=D

(ASC_NO_SWAP)
	@j
	M=M+1
	@k
	M=M+1

	@ASC_LOOP // goto LOOP
  0;JMP
(ASC_STOP)
  @i
  M=M-1
  D=M
  @50
  D=D-A
  @A_ASC_LOOP
  D;JGT	
  @CHECK
	0;JMP

(SORT_DSC)
	@R2
	D=!M
	D=D+1
	@i     //RAM[i]=-Z
	M=D-1  //exchange times
	@50
	D=A
	@i    //RAM[i]=50+Z-1 the last element
	M=M+D
(D_DSC_LOOP)
	@50
	D=A
	@j    //RAM[j]=50
	M=D
	@k    //RAM[k]=51
	M=D+1
(DSC_LOOP)
	@i    // if i=j goto STOP
	D=M
	@j
	D=M-D
	@DSC_STOP
	D;JEQ
	@j
	A=M   //50
	D=M   //RAM[50]
	@k
	A=M
	D=D-M  //RAM[50]-RAM[51]
	@DSC_NO_SWAP  //RAM[50]>RAM[51]
	D;JGE
	@DSC_SORT_SWAP
	D;JLT

(DSC_SORT_SWAP)
	@j
	A=M
	D=M
	@temp
	M=D
	  
	@k
	A=M
	D=M
	@j
	A=M
	M=D

	@temp
	D=M
	@k
	A=M
	M=D

(DSC_NO_SWAP)
	@j
	M=M+1
	@k
	M=M+1

	@DSC_LOOP // goto LOOP
  0;JMP
(DSC_STOP)
  @i
  M=M-1
  D=M
  @50
  D=D-A
  @D_DSC_LOOP
  D;JGT
  @CHECK
	0;JMP

(SED_SWAP)
	@R1
	D=M
	@temp
	M=D
    
	@R0
	D=M
	@R1
	M=D

	@temp
	D=M
	@R0
	M=D

(CHECK)
  @R0       // X
  D=M      
  @R3      // original X
	D=M-D    
	@SED_SWAP    
	D;JNE
(END_SORT)
	@END_SORT
	0;JMP