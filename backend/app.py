import csv
import io
from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS, cross_origin
from flask_pymongo import PyMongo

app = Flask(__name__)

# Configure the JWT manager with the secret key
app.config['JWT_SECRET_KEY'] = 'secret-key'
jwt = JWTManager(app)

CORS(app)

app.config['MONGO_DBNAME'] = 'AttendanceSystem'
app.config['MONGO_URI'] = 'mongodb://localhost:27017/AttendanceSystem'

mongo = PyMongo(app)


@app.route('/api/login', methods=['POST'])
@cross_origin()
def login():
    user = request.json
    email = user['email']
    user_type = user['userType']

    # Determine the JWT secret key based on user type
    if user_type == 'student':
        jwt_secret_key = 'student-secret-key'
    elif user_type == 'faculty':
        jwt_secret_key = 'faculty-secret-key'
    elif user_type == 'admin':
        jwt_secret_key = 'admin-secret-key'
    else:
        return jsonify({'msg': 'Invalid user type'}), 401

    # Verify user credentials
    if user_type == 'student':
        access_token = create_access_token(identity=email, additional_claims={
                                           'user_type': user_type})
        return jsonify({'access_token': access_token}), 200
    elif user_type == 'faculty':
        access_token = create_access_token(identity=email, additional_claims={
                                           'user_type': user_type})
        return jsonify({'access_token': access_token}), 200
    elif user_type == 'admin':
        access_token = create_access_token(identity=email, additional_claims={
                                           'user_type': user_type})
        return jsonify({'access_token': access_token}), 200
    else:
        return jsonify({'msg': 'Invalid credentials'}), 401


@app.route('/uploadAdmin', methods=['POST'])
def upload_file():
    year = request.form.get('year')
    section = request.form.get('section')
    mentor1 = request.form.get('mentor1')
    mentor2 = request.form.get('mentor2')
    if request.form.get('mentor3') != None:
        mentor3 = request.form.get('mentor3')
    else:
        mentor3 = ""
    print(mentor1, mentor2, mentor3)
    file = request.files['file']
    stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
    csv_input = csv.reader(stream)
    required_headers = ['Name of the Student', 'Register Number', 'Official Mail ID (College)',
                        'Father Mobile number', 'Mother Mobile number']
    # Get the header row from CSV file
    headers = next(csv_input)

    # Get the indices of the required fields
    required_indices = [headers.index(header) for header in required_headers]

    # Extract the required data from the CSV
    student_data = []
    for row in csv_input:
        student = {}
        if all(val == '' for val in row):
            continue
        for index in required_indices:
            if headers[index] == 'Name of the Student':
                student[headers[index]] = row[index].upper()
            if headers[index] == 'Register Number':
                student[headers[index]] = row[index].upper()
            else:
                student[headers[index]] = row[index]
        student['year'] = year
        student['section'] = section
        student['mentor1'] = mentor1
        student['mentor2'] = mentor2
        if (mentor3):
            student['mentor3'] = mentor3
        student_data.append(student)
        # Create collection named after year and section

    existing_collection = mongo.db.get_collection(f'{year}_{section}', None)
    if existing_collection is not None:
        # Check if existing collection has same data
        existing_data = [
            doc for doc in existing_collection.find({}, {'_id': 0})]
        if existing_data == student_data:
            # Return already exists
            return jsonify({'message': 'Data already exists'}), 200

        # Drop existing collection
        existing_collection.drop()

    # Insert data into new collection
    mongo.db[f'{year}_{section}'].insert_many(student_data)

    return jsonify({'message': 'Data added successfully'}), 200


@app.route('/getdata', methods=['POST'])
def get_students():
    user = request.json
    year = user['year']
    section = user['section']
    print(year)
    print(section)

    collection_name = f"{year}_{section}"
    if not mongo.db.list_collection_names(filter={"name": collection_name}):
        return jsonify({'message': f"No data found for year {year} and section {section}"}), 404

    data = list(mongo.db[collection_name].aggregate([
        {
            "$project": {
                "_id": 0,
                "name": "$Name of the Student",
                "register_no": "$Register Number",
                "mail_id": "$Official Mail ID (College)",
                "father_mobile_number": "$Father Mobile number",
                "mother_mobile_number": "$Mother Mobile number"
            }
        }
    ]))

    for i, record in enumerate(data):
        record['sno'] = i + 1

    return jsonify(data), 200


@app.route('/addStudent', methods=['POST'])
def add_student():
    user = request.json
    name = user['name']
    regno = user['regno']
    mailid = user['mailid']
    fatherno = user['fatherno']
    motherno = user['motherno']
    year = user['year']
    section = user['section']
    collection_name = f"{year}_{section}"
    print(collection_name)
    students_collection = mongo.db[collection_name]
    year_section_mentor = students_collection.find_one(
        {}, {'_id': 0, 'mentor1': 1, 'mentor2': 1, 'mentor3': 1})

    mentor1 = year_section_mentor['mentor1']
    mentor2 = year_section_mentor['mentor2']
    mentor3 = year_section_mentor.get('mentor3', '')
    existing_student = students_collection.find_one({'Register Number': regno})
    if existing_student:
        return jsonify({'message': 'duplicate'}), 201
    first_record = students_collection.find_one()
    common_fields = list(first_record.keys())

    student_data = {}
    student_data[common_fields[1]] = name
    student_data[common_fields[2]] = regno
    student_data[common_fields[3]] = mailid
    student_data[common_fields[4]] = fatherno
    student_data[common_fields[5]] = motherno
    student_data[common_fields[6]] = year
    student_data[common_fields[7]] = section
    student_data[common_fields[8]] = mentor1
    student_data[common_fields[9]] = mentor2
    if mentor3:
        student_data['mentor3'] = mentor3
    students_collection.insert_one(student_data)
    return jsonify({'message': 'success'}), 200


@app.route('/editStudent', methods=['POST'])
def edit_student():
    user = request.json
    name = user['name']
    regno = user['regno']
    mailid = user['mailid']
    fatherno = user['fatherno']
    motherno = user['motherno']
    year = user['year']
    section = user['section']
    collection_name = f"{year}_{section}"
    print(collection_name)
    students_collection = mongo.db[collection_name]
    year_section_mentor = students_collection.find_one(
        {}, {'_id': 0, 'mentor1': 1, 'mentor2': 1, 'mentor3': 1})

    mentor1 = year_section_mentor['mentor1']
    mentor2 = year_section_mentor['mentor2']
    mentor3 = year_section_mentor.get('mentor3', '')
    existing_student = students_collection.find_one({'Register Number': regno})
    if existing_student:
        first_record = students_collection.find_one()
        common_fields = list(first_record.keys())

        student_data = {}
        student_data[common_fields[1]] = name
        student_data[common_fields[2]] = regno
        student_data[common_fields[3]] = mailid
        student_data[common_fields[4]] = fatherno
        student_data[common_fields[5]] = motherno
        student_data[common_fields[6]] = year
        student_data[common_fields[7]] = section
        student_data[common_fields[8]] = mentor1
        student_data[common_fields[9]] = mentor2
        if mentor3:
            student_data['mentor3'] = mentor3
        students_collection.update_one(
            {'Register Number': regno}, {'$set': student_data})
        return jsonify({'message': 'success'}), 200


@app.route('/deleteStudent', methods=['POST'])
def delete_student():
    user = request.json
    print(user)
    year = user['year']
    section = user['section']
    regno = user['regno']
    collection_name = f"{year}_{section}"
    students_collection = mongo.db[collection_name]
    students_collection.delete_one({
        "Register Number": regno})
    return jsonify({'message': 'success'}), 200


CORS(app)


@app.route('/getFacultyData', methods=['POST'])
def get_faculty_data():
    user = request.json
    email = user['email']
    collections = mongo.db.list_collection_names()
    print(collections)

    for collection in collections:
        document = mongo.db[collection].find_one()
        if (document):
            if email in [document.get("mentor1"), document.get("mentor2"), document.get("mentor3")]:
                year = document.get("year")
                section = document.get("section")
                return jsonify({"year": year, "section": section, "message": "Got"}), 200
            else:
                return jsonify({'message': 'no'}), 200
# return the results as a JSON response


if __name__ == '__main__':
    app.run(debug=True)
