    .data
prompt: 
    .asciiz "Enter an integer (1 to 100):"
error:  
    .asciiz "Error: Please enter a value between 1 and 100.\n"
primeMsg: 
    .asciiz " is a prime number.\n"
notPrimeMsg: 
    .asciiz " is not a prime number.\n"
sumMsg: 
    .asciiz "Sum from 1 to "
sumResultMsg: 
    .asciiz ": "
endMsg: 
    .asciiz "Thank you for using the program. Goodbye!\n"
carriagereturn: 
    .asciiz "\n"

.text
.globl main 

main:
    # Prompt the user for input
    lui $a0, 0x1001 
    ori $v0, $zero, 4
    syscall

    # Read integer input
    ori $v0, $zero, 5
    syscall
    addu $t0, $zero, $v0 # Store input in $t0

    # Check if input is 1, not prime
    ori $t1, $zero, 1
    beq $t0, $t1, notPrime

    # Check if input is within range
    ori $t1, $zero, 1
    ori $t2, $zero, 100
    slt $t9, $t0, $t1
    bne $t9, $zero, inputError
    slt $t9, $t2, $t0
    bne $t9, $zero, inputError

    # Check if the number is prime
    addu $t3, $zero, $t0
    ori $t4, $zero, 2
    addu $t5, $zero, $zero

primeCheck:
    slt $t9, $t4, $t3
    bne $t9, $zero, continueCheck
    j isPrime

continueCheck:
    div $t3, $t4
    mfhi $t7
    beq $t7, $zero, notPrime
    addi $t4, $t4, 1
    j primeCheck

isPrime:
    # If no divisors found, it's prime
    ori $v0, $zero, 1
    addu $a0, $zero, $t0
    syscall
    lui $a0, 0x1001 
    ori $a0, $a0, 77
    ori $v0, $zero, 4
    syscall

    # Compute sum from 1 to X
    ori $t4, $zero, 1
    ori $t5, $zero, 0

sumLoop:
    slt $t9, $t0, $t4
    bne $t9, $zero, printSum
    add $t5, $t5, $t4
    addi $t4, $t4, 1
    j sumLoop

printSum:
    lui $a0, 0x1001 
    ori $a0, $a0, 123
    ori $v0, $zero, 4
    syscall
    ori $v0, $zero, 1
    addu $a0, $zero, $t0
    syscall
    lui $a0, 0x1001 
    ori $a0, $a0, 138
    ori $v0, $zero, 4
    syscall
    ori $v0, $zero, 1
    addu $a0, $zero, $t5
    syscall    
    lui $a0, 0x1001 
    ori $a0, $a0, 184
    ori $v0, $zero, 4
    syscall
    j printEndMsg

notPrime:
    ori $v0, $zero, 1
    addu $a0, $zero, $t0
    syscall
    lui $a0, 0x1001 
    ori $a0, $a0, 98
    ori $v0, $zero, 4
    syscall
    j printEndMsg

inputError:
    lui $a0, 0x1001
    ori $a0, $a0, 29 
    ori $v0, $zero, 4
    syscall
    j main

printEndMsg:
    lui $a0, 0x1001 
    ori $a0, $a0, 141
    ori $v0, $zero, 4
    syscall

end:
    ori $v0, $zero, 10
    syscall