// 20616309 scyyw25 Yushan Wang 
#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>

#define MAX_STUDENTS 1000
#define MAX_NAME_LENGTH 20
#define MAX_SUBJECTS 5
#define MAX_GRADE 100

typedef struct {
    char name[MAX_NAME_LENGTH];
    float subject_1_grade; 
    float subject_2_grade;
    float subject_3_grade;
    float subject_4_grade;
    float subject_5_grade;
} Student;

Student students[MAX_STUDENTS];
int student_count = 0;

// Function declaration
int get_valid_choice();
int get_valid_subject();
int is_unique_name(const char *name);
int is_valid_float(const char *str);
int is_valid_name(const char *name);
void add_student();
void display_students();
void calculate_class_average();
void find_highest_lowest_grade();


int main() {
    int choice;

    while (1) {
        printf("\n===== Student Grades Management System =====\n");
        printf("1. Add Student\n");
        printf("2. Display All Students\n");
        printf("3. Calculate Class Average\n");
        printf("4. Find Highest and Lowest Grade\n");
        printf("0. Exit\n");
        printf("Enter your choice: ");
        
        choice = get_valid_choice();

        switch (choice) {
            case 1:
                add_student();
                break;
            case 2:
                display_students();
                break;
            case 3:
                calculate_class_average();
                break;
            case 4:
                find_highest_lowest_grade();
                break;
            case 0:
                return 0;
            default:
                break;
        }
    }
    return 0;    
}

int get_valid_choice() {
    char input[10];
    int choice;

    while (1) {
        scanf("%9s", input); 
        while (getchar() != '\n'); 

        // check if number
        int is_number = 1;
        for (int i = 0; input[i] != '\0'; i++) {
            if (!isdigit(input[i])) { // if number:12.aa
                is_number = 0;
                break;
            }
        }

        if (is_number) {
            sscanf(input, "%d", &choice); 

            //001
            if (input[0] == '0' && strlen(input) > 1) {
                continue;
            }

            // 1.11
            if (strchr(input, '.') != NULL) {
                continue;
            }

            // 0-4
            if (choice >= 0 && choice <= 4) {
                return choice; 
            } 
        } 
    }
}

int get_valid_subject() {
    char input[10];
    int subject;

    while (1) {
        scanf("%9s", input); 
        while (getchar() != '\n'); 

        // check if number
        int is_number = 1;
        for (int i = 0; input[i] != '\0'; i++) {
            if (!isdigit(input[i])) { // if number:12.aa
                is_number = 0;
                break;
            }
        }

        if (is_number) {
            sscanf(input, "%d", &subject); 

            //001
            if (input[0] == '0' && strlen(input) > 1) {
                continue;
            }

            // 1.11
            if (strchr(input, '.') != NULL) {
                continue;
            }

            // 1-5
            if (subject >= 1 && subject <= 5) {
                return subject; 
            } 
        } 
    }
}

int is_unique_name(const char *name) {
    for (int i = 0; i < student_count; i++) {
        if (strcmp(students[i].name, name) == 0) {
            return 0;
        }
    }
    return 1;
}

int is_valid_float(const char *str) {
    char *endptr;
    double val = strtod(str, &endptr);

    if (*endptr != '\0') {
        return 0; 
    }
    
    if (val < 0.0 || val > 100.0) {
        return 0; 
    }
    return 1; 
}

int is_valid_name(const char *name) {
    if (strlen(name) > MAX_NAME_LENGTH) {
        return 0;
    }
    if (!isalpha(name[0]) || !isalpha(name[strlen(name) - 1])) {
        return 0;
    }
    for (int i = 1; i < strlen(name) - 1; i++) {
        if (!isalnum(name[i]) && name[i] != ' ') {
            return 0;
        }
    }
    return 1;
}

void add_student() {
    char name[MAX_NAME_LENGTH + 1];
    char grade_input[20];
    float subject_1_grade, subject_2_grade, subject_3_grade, subject_4_grade, subject_5_grade;

    printf("Enter student name: ");
    while (1) {
        fgets(name,50, stdin);
        name[strcspn(name, "\n")] = 0; 
        if (is_valid_name(name) && is_unique_name(name)) {
            break;
        }
    }

    printf("Enter grades for 5 subjects:\n");
    
    for (int i = 1; i <= 5; i++) {
        printf("Grade for subject %d: ", i);
        while (1) {
            scanf("%19s", grade_input);
            while (getchar() != '\n'); 
            if (is_valid_float(grade_input)) {
                switch (i) {
                    case 1: subject_1_grade = atof(grade_input); break;
                    case 2: subject_2_grade = atof(grade_input); break;
                    case 3: subject_3_grade = atof(grade_input); break;
                    case 4: subject_4_grade = atof(grade_input); break;
                    case 5: subject_5_grade = atof(grade_input); break;
                }
                break;
            }
        }
    }

    strcpy(students[student_count].name, name);
    students[student_count].subject_1_grade = subject_1_grade;
    students[student_count].subject_2_grade = subject_2_grade;
    students[student_count].subject_3_grade = subject_3_grade;
    students[student_count].subject_4_grade = subject_4_grade;
    students[student_count].subject_5_grade = subject_5_grade;
    student_count++;
    printf("Student added successfully.\n");
}
void display_students() {
    for (int i = 0; i < student_count; i++) {
        printf("%d.Name: %s\n  Subject 1 grade: %.2f\n  Subject 2 grade: %.2f\n  Subject 3 grade: %.2f\n  Subject 4 grade: %.2f\n  Subject 5 grade: %.2f\n",i+1,students[i].name, students[i].subject_1_grade,students[i].subject_2_grade,students[i].subject_3_grade,students[i].subject_4_grade,students[i].subject_5_grade);
    }
}
void calculate_class_average() {
    int subject;
    printf("Enter the subject number (1-5) to calculate average: ");
    subject=get_valid_subject();
    float sum = 0;
    int count = 0; 
    for (int i = 0; i < student_count; i++) {
        float grades ;
        switch (subject) {
            case 1: grades = students[i].subject_1_grade; break;
            case 2: grades = students[i].subject_2_grade; break;
            case 3: grades = students[i].subject_3_grade; break;
            case 4: grades = students[i].subject_4_grade; break;
            case 5: grades = students[i].subject_5_grade; break;
        }
        sum += grades;
    }
    float average = sum / student_count;
    printf("Class average for subject %d is: %.2f\n", subject, average);
}
void find_highest_lowest_grade() {
    int subject;
    printf("Enter the subject number (1-5) to find highest and lowest grade: ");
    subject=get_valid_subject();
    float highest = -1, lowest = MAX_GRADE + 1;
    char highest_name[MAX_NAME_LENGTH]={0}, lowest_name[MAX_NAME_LENGTH]={0};
    for (int i = 0; i < student_count; i++) {
        float grade ;
        switch (subject) {
            case 1: grade = students[i].subject_1_grade; break;
            case 2: grade = students[i].subject_2_grade; break;
            case 3: grade = students[i].subject_3_grade; break;
            case 4: grade = students[i].subject_4_grade; break;
            case 5: grade = students[i].subject_5_grade; break;
        }
        if (grade > highest) {
            highest = grade;
            strcpy(highest_name, students[i].name);
        }
        if (grade < lowest) {
            lowest = grade;
            strcpy(lowest_name, students[i].name);
        }
    }
    if (highest != -1) {
        printf("Highest grade in subject %d: %.2f (by %s)\n", subject, highest, highest_name);
    } else {
        printf("No highest grade found for subject %d.\n", subject);
    }
    if (lowest != MAX_GRADE + 1) {
        printf("Lowest grade in subject %d: %.2f (by %s)\n", subject, lowest, lowest_name);
    } else {
        printf("No lowest grade found for subject %d.\n", subject);
    }
}