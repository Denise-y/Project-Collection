//20616309 scyyw25 Yushan Wang
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdbool.h>
#include <math.h>

#define MAX_TARGETS 100
#define MAX_LINE_LENGTH 1024


typedef struct {
    char name[15];
    double latitude;
    double longitude;
} Target;

typedef struct {
    Target targets[MAX_TARGETS];
    int count;
} TempStorage;

Target *targets = NULL;
int targetCount = 0;
int capacity = 0;

void resizeTargets(int newCapacity) {
    Target *newTargets = realloc(targets, newCapacity * sizeof(Target));
    if (newTargets == NULL) {
        printf("Memory allocation failed.\n");
        exit(1);
    }
    targets = newTargets;
    capacity = newCapacity;
    
    if (newCapacity < targetCount) {
        targetCount = newCapacity;  
    }
}

void addTarget(const char *name, double latitude, double longitude) {
    if (targetCount >= capacity) {
        int newCapacity = capacity > 0 ? capacity * 2 : 1;
        resizeTargets(newCapacity);
    }
    strcpy(targets[targetCount].name, name);
    targets[targetCount].latitude = latitude;
    targets[targetCount].longitude = longitude;
    targetCount++;
}

int get_valid_option(){
    char input[10];
    int option;

    while (1) {
        printf("Option: ");
        scanf("%9s", input); 
        while (getchar() != '\n'); 

        //remove line breaks
        input[strcspn(input, "\n")] = 0;

        if (strlen(input) == 1 && isdigit(input[0])) {
            option = atoi(input);
            if (option >= 1 && option <= 6) {
                return option;
            }
        }
        printf("Unknown option.\n");
    }
}

bool is_Valid_Name(const char *name) {
    int length = strlen(name); 
    if (length > 15) {
        return false; 
    }

    for (int i = 0; i < length; i++) {
        if (!isalpha(name[i]) && !isdigit(name[i])) {
            return false; 
        }
    }

    return true; 
}

double get_Valid_Latitude() {
    double latitude;
    char input[50];
    char *endptr;
    
                
    while (1) {
        int decimal_places = 0;
        printf("Enter predicted latitude: ");
        scanf("%19s", input);
        while (getchar() != '\n');
        latitude = strtod(input, &endptr);
        if (strchr(input, '.')) {
            decimal_places = strlen(strchr(input, '.') + 1);
        }

        if (decimal_places > 15 || *endptr != '\0' || latitude < 0.0 || latitude > 100.0) {
            printf("Invalid coordinate value!\nA coordinate should be within [0, 100] and no more than 15 decimals.\n");
            continue; 
        }

        break; 
    }

    return latitude;
}

double get_Valid_Longitude() {
    double longitude;
    char input[50];
    char *endptr;
    
                
    while (1) {
        int decimal_places = 0;
        printf("Enter predicted longitude: ");
        scanf("%19s", input);
        while (getchar() != '\n');
        longitude = strtod(input, &endptr);
        if (strchr(input, '.')) {
            decimal_places = strlen(strchr(input, '.') + 1);
        }

        if (decimal_places > 15 || *endptr != '\0' || longitude < 0.0 || longitude > 100.0) {
            printf("Invalid coordinate value!\nA coordinate should be within [0, 100] and no more than 15 decimals.\n");
            continue; 
        }

        break; 
    }

    return longitude;
}

double get_Valid_Radius() {
    double radius;
    char input[50];
    char *endptr;
    int decimal_places = 0;
    while (1) {
        printf("Enter radius of damage zone: ");
        fgets(input, 50, stdin);
        size_t len = strlen(input);
        //remove \n
        if (len > 0 && input[len - 1] == '\n') {
            input[len - 1] = '\0';
        }
        radius = strtod(input, &endptr);
        if (strchr(input, '.')) {
            decimal_places = strlen(strchr(input, '.') + 1);
        }
        if (decimal_places > 15 || *endptr != '\0' || radius < 0.0 || radius > 20.0) {
            printf("Invalid radius value.\n");
        }else{
            break;
        }
    }
    return radius;
}

bool is_Target_in(double x1, double y1, double r, double x2, double y2){
    double distance=sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2));
    return distance <= r;
}

bool is_Valid_Coordinate(const char *str, double *value) {
    char *endptr;
    *value = strtod(str, &endptr);
    
    if (endptr == str || *endptr != '\0') {
        return false;
    }

    int decimal_places = 0;
    const char *decimal_point = strchr(str, '.');
    if (decimal_point != NULL) {
        decimal_places = strlen(decimal_point + 1);
    }

    
    if (decimal_places > 12) {
        return false;
    }

    if (*value < 0 || *value > 100) { 
        return false;
    }

    return true;
}

bool validate_Decimal_Format(const char *coordinate) {
    int decimal_places = 0;
    const char *dot = strchr(coordinate, '.');

    // Check for invalid characters
    for (int i = 0; coordinate[i] != '\0'; i++) {
        if (!isdigit(coordinate[i]) && coordinate[i] != '.' && coordinate[i] != '+') {
            return false;
        }
    }

    // Check decimal precision
    if (dot != NULL) {
        decimal_places = strlen(dot + 1);
        if (decimal_places > 15) {
            return false;
        }
    }

    return true;
}

void load_Target_File(const char *filename) {
    FILE *file = fopen(filename, "r");
    if (!file) {
        printf("Invalid file.\n");
        return;
    }

    TempStorage tempStorage = {{0}, 0};
    char buffer[MAX_LINE_LENGTH];
    char tempData[3][MAX_LINE_LENGTH]; // Buffer for incomplete data
    int tempCount = 0; // Counter for buffered data

    while (fgets(buffer, MAX_LINE_LENGTH, file)) {
        char *token = strtok(buffer, " \n"); // Split by space or newline
        while (token != NULL) {
            strncpy(tempData[tempCount], token, MAX_LINE_LENGTH - 1);
            tempData[tempCount][MAX_LINE_LENGTH - 1] = '\0';
            tempCount++;

            if (tempCount == 3) {
                char name[15];
                double latitude, longitude;

                // Validate name
                if (!is_Valid_Name(tempData[0])) {
                    printf("Invalid file.\n");
                    fclose(file);
                    return;
                }
                strncpy(name, tempData[0], sizeof(name) - 1);
                name[sizeof(name) - 1] = '\0';

                // Validate latitude
                if (!is_Valid_Coordinate(tempData[1], &latitude) || !validate_Decimal_Format(tempData[1])) {
                    printf("Invalid file.\n");
                    fclose(file);
                    return;
                }

                // Validate longitude
                if (!is_Valid_Coordinate(tempData[2], &longitude) || !validate_Decimal_Format(tempData[2])) {
                    printf("Invalid file.\n");
                    fclose(file);
                    return;
                }

                // Check for duplicate entries
                bool duplicate = false;
                for (int i = 0; i < targetCount; i++) {
                    if (strcmp(targets[i].name, name) == 0 &&
                        fabs(targets[i].latitude - latitude) < 1e-9 &&
                        fabs(targets[i].longitude - longitude) < 1e-9) {
                        duplicate = true;
                        break;
                    }
                }
                if (!duplicate) {
                    // Add valid entry to temporary storage
                    strncpy(tempStorage.targets[tempStorage.count].name, name, sizeof(name));
                    tempStorage.targets[tempStorage.count].latitude = latitude;
                    tempStorage.targets[tempStorage.count].longitude = longitude;
                    tempStorage.count++;
                    
                }

                tempCount = 0; // Reset buffer after processing
            }

            token = strtok(NULL, " \n");
        }
    }

    // Check if there are leftover incomplete data
    if (tempCount != 0) {
        printf("Invalid file.\n");
        fclose(file);
        return;
    }

    // Copy valid data from temporary storage to main targets array
    for (int i = 0; i < tempStorage.count; i++) {
        addTarget(tempStorage.targets[i].name, tempStorage.targets[i].latitude, tempStorage.targets[i].longitude);
    }

    fclose(file);
}


void show_Current_Targets() {
    for (int i = 0; i < targetCount; i++) {
        printf("%s %lf %lf\n", targets[i].name, targets[i].latitude, targets[i].longitude);
    }
}

void search_Target(const char *name) {
    for (int i = 0; i < targetCount; i++) {
        if (strcmp(targets[i].name, name) == 0) {
            printf("%s %lf %lf\n", targets[i].name, targets[i].latitude, targets[i].longitude);
            return;
        }
    }
    printf("Entry does not exist.\n");
}

void plan_Airstrike() {
    double x1, y1, x2, y2, r;
    char input[50];

    x1=get_Valid_Latitude();
    y1=get_Valid_Longitude();
    r=get_Valid_Radius();

    int found = 0;
    for (int i = 0; i < targetCount; i++) {
        x2=targets[i].latitude;
        y2=targets[i].longitude;
        if (is_Target_in(x1,y1,r,x2,y2)){
            printf("%s %lf %lf\n", targets[i].name, x2, y2);
            found = 1;
        }
    }
    if (!found) {
        printf("No target found.\n");
    }
}

void execute_Airstrike() {
    double x1, y1, x2, y2, r;
    char input[50];

    x1=get_Valid_Latitude();
    y1=get_Valid_Longitude();
    r=get_Valid_Radius();

    int found = 0;
    int indices[MAX_TARGETS]; 
    
    for (int i = 0; i < targetCount; i++) {
        x2 = targets[i].latitude;
        y2 = targets[i].longitude;
        if (is_Target_in(x1, y1, r, x2, y2)) {
            indices[found++] = i; 
        }
    }

    if (found == 0) {
        printf("No target aimed. Mission cancelled.\n");
        return;
    }

    // show
    printf("%d target destroyed.\n",found);
    for (int i = 0; i < found; i++) {
        int idx = indices[i];
        printf("%s %f %f\n", targets[idx].name, targets[idx].latitude, targets[idx].longitude);

        //delete
        for (int j = idx; j < targetCount - 1; j++) {
            strcpy(targets[j].name, targets[j + 1].name);
            targets[j].latitude = targets[j + 1].latitude;
            targets[j].longitude = targets[j + 1].longitude;
        }
        targetCount--; 
    }
    // Resize the array if necessary
    if (targetCount == 0 || targetCount == capacity / 4) {
        int newCapacity = targetCount > 0 ? capacity / 2 : 1;
        resizeTargets(newCapacity);
    }
}

int main() {
    int option;
    char filename[15];
    char targetName[15];
    targets = malloc(sizeof(Target)); 
    if (targets == NULL) {
        printf("Memory allocation failed.\n");
        return 1;
    }
    capacity = 1;
    printf("1) Load a target file\n");
    printf("2) Show current targets\n");
    printf("3) Search a target\n");
    printf("4) Plan an airstrike\n");
    printf("5) Execute an airstrike\n");
    printf("6) Quit\n");
    while (1) {

        option= get_valid_option();

        switch (option) {
            case 1:
                printf("Enter a target file: ");
                scanf("%s", filename);
                load_Target_File(filename);
                break;
            case 2:
                if (targetCount != 0) show_Current_Targets();
                break;
            case 3:
                printf("Enter the name: ");
                scanf("%s", targetName);
                search_Target(targetName);
                break;
            case 4:
                plan_Airstrike();
                break;
            case 5:
                execute_Airstrike();
                break;
            case 6:
                return 0;
        }
    }
    free(targets);
    return 0;
}