# Name:Yushan Wang
# Student ID:20616309
# References (list any resources you've used in developing the code)
# e.g. - Flask documentation: https://flask.palletsprojects.com/en/stable/

import csv
import sqlite3
from pathlib import Path

from flask import (
    Flask,
    flash,
    redirect,
    render_template,
    request,
    url_for
)

app = Flask(__name__)

# Configuration
# The "Path.cwd()" function returns the current working directory. 
UPLOAD_FOLDER = Path.cwd() / 'uploads'
DB_FILE = Path.cwd() / 'data/iMusic.db'


####################
# Routes
####################

@app.route('/', methods=['GET'])
def index():
    """
    [No Need to Modify]
    Renders the home page.

    Returns:
        - The 'index.html' template.
    """
    return render_template('index.html')

@app.route('/upload/', methods=['GET', 'POST'])
def upload_route():
    """
    [No Need to Modify]

    Task 1: Handles file uploads for updating customer data.
    
    GET: Renders the upload page.
    POST: Processes the uploaded file, saves it, and updates the database.

    Returns:
        - Renders the upload.html template on GET.
        - Redirects to the index page on successful upload and database update.
    """
    if request.method == 'POST':
        # Retrieve the uploaded file
        file = request.files.get('file')
        if not file:
            flash('No file selected. Please upload a valid file.', 'warning')
            return redirect(url_for('upload_route'))

        # Define the path to save the uploaded file
        uploaded_file_path = UPLOAD_FOLDER / 'Customers.tsv'

        try:
            # Ensure the upload folder exists
            UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
            
            # Save the uploaded file
            file.save(uploaded_file_path)
            flash('File uploaded successfully.', 'success')

            # Update the database with the uploaded file
            update_customers(uploaded_file_path)
            flash('Customers updated successfully.', 'success')
        except Exception as e:
            # Handle errors during file saving or database update
            flash(f'An error occurred: {str(e)}', 'danger')
            return redirect(url_for('upload_route'))

        # Redirect to the home page after successful upload
        return redirect(url_for('index'))

    # Render the upload page for GET requests
    return render_template('upload.html')

@app.route('/statistics/', methods=['GET', 'POST'])
def statistics():
    countries = get_all_countries()
    country = 'All'
    statistics = []
    if request.method == 'POST':
        country = request.form.get('country')
        countries = get_all_countries()
        #check country 
        if country not in countries:
            flash('Invalid country selected', 'danger')
            return redirect(url_for('statistics'))
        statistics = get_statistics(country)
    
    return render_template('statistics.html', countries=countries, statistics=statistics, selected_country=country)

@app.route('/invoice/', methods=['GET'])
def invoice():
    customers = get_all_customers()
    albums = get_all_albums()
    return render_template('invoice.html', customers=customers, albums=albums)

@app.route('/generate_invoice/', methods=['POST'])
def generate_invoice():
    customer_id = request.form.get('customer')
    selections = request.form.getlist('albums')  
    address = request.form.get('address')
    city = request.form.get('city')
    country = request.form.get('country')
    postal_code = request.form.get('postal_code')
    

    # verify the data
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT EXISTS(SELECT 1 FROM Customer WHERE CustomerId = ?)", (customer_id,))
    if not cursor.fetchone()[0]:
        flash('Invalid customer selected', 'danger')
        conn.close()
        return redirect(url_for('invoice'))    
    
    cursor.execute("SELECT EXISTS(SELECT 1 FROM Album WHERE AlbumId IN (%s))" % (','.join(['?'] * len(selections))), selections)
    if not cursor.fetchone()[0]:
        flash('Invalid album selected', 'danger')
        conn.close()
        return redirect(url_for('invoice'))
    conn.close()

    #create a new invoice
    try:
        process_invoice_in_db(customer_id, selections, address, city, country, postal_code)
        flash('Invoice generated successfully.', 'success')
    except Exception as e:
        flash('An error occurred', 'danger')
        return redirect(url_for('invoice'))
    return redirect(url_for('invoice'))
    #return render_template('invoice.html')

@app.errorhandler(404)
def page_not_found(e):
    """
    [No Need to Modify]
    Renders the error page for 404 errors.

    Returns:
        - The 'error.html' template with a 404 status code.
    """
    return render_template('error.html', messages=['404: Page not found.']), 404


####################
# Functions
####################

def update_customers(customer_tsv_file):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # read tsv
    with open(customer_tsv_file, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file, delimiter='\t')
        next(reader, None)
        for row in reader:
            customerId = row["CustomerId"]
            cursor.execute("SELECT EXISTS(SELECT 1 FROM Customer WHERE CustomerId=?)", (customerId,))
            if cursor.fetchone()[0]:  # if customer exist
                phone = row['Phone']
                fax = row.get('Fax', None)
                cursor.execute("UPDATE Customer SET Phone=?, Fax=? WHERE CustomerId=?", (phone, fax, customerId))      
    # commit
    conn.commit()
    cursor.close()
    conn.close()

def get_all_countries():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT DISTINCT Country FROM Customer ORDER BY Country ASC")
    countries = ['All'] + [row[0] for row in cursor.fetchall()]
    
    cursor.close()
    conn.close()
    
    return countries

def get_statistics(country):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    if country == 'All':
        cursor.execute("""
            SELECT 
              Customer.CustomerId AS customer_id, 
              Customer.FirstName ||' '||UPPER(Customer.LastName) AS name, 
              Customer.Email AS email, 
              Customer.City AS city, 
              COUNT(Invoice.InvoiceId) AS number_of_invoices, 
              ROUND(IFNULL(SUM(Invoice.Total),0),2) AS total_amount, 
              ROUND(IFNULL(AVG(Invoice.Total),0),2) AS average_amount
            FROM Customer
            LEFT JOIN Invoice 
            ON Customer.CustomerId = Invoice.CustomerId
            GROUP BY Customer.CustomerId
            UNION
            SELECT 
              'Total' AS customer_id , 
              NULL AS name, 
              NULL AS email, 
              NULL AS city,
              COUNT(*) AS number_of_invoices,
              ROUND(IFNULL(SUM(Invoice.Total),0),2) AS total_amount, 
              ROUND(IFNULL(AVG(Invoice.Total),0),2) AS average_amount
            FROM Customer
            LEFT JOIN Invoice 
            ON Customer.CustomerId = Invoice.CustomerId
        """)
    else:
        cursor.execute("""
            SELECT 
                Customer.CustomerId AS customer_id, 
                Customer.FirstName ||' '||UPPER(Customer.LastName) AS name, 
                Customer.Email AS email, 
                Customer.City AS city, 
                COUNT(Invoice.InvoiceId) AS number_of_invoices, 
                ROUND(SUM(Invoice.Total),2) AS total_amount, 
                ROUND(AVG(Invoice.Total),2) AS average_amount
            FROM Customer
            LEFT JOIN Invoice 
            ON Customer.CustomerId = Invoice.CustomerId 
            GROUP BY Customer.CustomerId
            HAVING Customer.Country = ?
            UNION
            SELECT 
                'Total' AS customer_id , 
                NULL AS name, 
                NULL AS email, 
                NULL AS city,
                COUNT(*) AS number_of_invoices,
                ROUND(SUM(Invoice.Total),2) AS total_amount,
                ROUND(AVG(Invoice.Total),2) AS average_amount
            FROM Customer
            LEFT JOIN Invoice 
            ON Customer.CustomerId = Invoice.CustomerId 
            WHERE Customer.Country = ?
        """,(country,country))    
    
    statistics = [{'customer_id': row[0], 'name': row[1] if row[1] is not None else '', 'email': row[2] if row[2] is not None else '', 'city': row[3] if row[3] is not None else '', 'number_of_invoices': row[4], 'total_amount': row[5], 'average_amount': row[6]} for row in cursor.fetchall()]
    
    cursor.close()
    conn.close()
    
    return statistics

def get_all_customers():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            CustomerId, 
            FirstName || ' ' || UPPER(LastName) AS FullName,
            Address, City, Country, PostalCode
        FROM Customer
    """)
    customers = [{'customer_id': row[0], 'name': row[1], 'address':row[2], 'city':row[3], 'country':row[4], 'postal_code':row[5]} for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return customers

def get_all_albums():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT Album.AlbumId, Album.Title, Artist.Name, ROUND(SUM(Track.UnitPrice), 2) AS AlbumPrice
        FROM Album
        JOIN Artist ON Album.ArtistId = Artist.ArtistId
        JOIN Track ON Album.AlbumId = Track.AlbumId
        GROUP BY Album.AlbumId
        ORDER BY Artist.Name, Album.Title
        """)
    albums = [{'album_id': row[0], 'title': row[1], 'artist': row[2], 'price': row[3]} for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return albums

def process_invoice_in_db(customer_id, selections, address, city, country, postal_code):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    #create a new invoice
    cursor.execute("""
    INSERT INTO Invoice (CustomerId, InvoiceDate, BillingAddress, BillingCity, BillingCountry, BillingPostalCode,Total) 
    VALUES (?, DATETIME('now'), ?, ?, ?, ?, 0)
    """,(customer_id, address, city, country, postal_code))

    invoice_id = cursor.lastrowid
    total=0

    #create a new invoiceline
    for album_id in selections:
        cursor.execute("""
        SELECT TrackId, UnitPrice FROM Track WHERE AlbumId = ?
        """, (album_id,))
        tracks = cursor.fetchall()
        for track in tracks:
            track_id, unit_price = track
            cursor.execute("""
            INSERT INTO InvoiceLine (InvoiceId, TrackId, UnitPrice, Quantity)
            VALUES (?, ?, ?, 1)
            """, (invoice_id, track_id, unit_price))
            total += unit_price  

    #update totalprice
    cursor.execute("UPDATE Invoice SET Total = ? WHERE InvoiceId = ?", (total, invoice_id))

    conn.commit()
    cursor.close()
    conn.close()


####################
# Main
####################

def main():
    """Run the Flask application."""
    app.secret_key = 'I love dbi'  # Secret key for session management
    app.run(debug=True, port=5000)


if __name__ == '__main__':
    main()