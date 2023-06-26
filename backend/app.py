import csv
import io
import ssl
from flask import Flask, jsonify, request
import certifi
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS, cross_origin
from flask_pymongo import PyMongo
from pymongo import MongoClient
from datetime import datetime, time
from dateutil.rrule import rrule, MONTHLY, DAILY
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

app = Flask(__name__)


# Configure the JWT manager with the secret key
app.config['JWT_SECRET_KEY'] = 'secret-key'
jwt = JWTManager(app)
CORS(app)
# uri = "mongodb+srv://nigun:XhwoAqBIHyFJNdL5@cluster0.o3xkdml.mongodb.net/?retryWrites=true&w=majority"
# uri = "mongodb+srv://nigun:XhwoAqBIHyFJNdL5@cluster0.tfyhtme.mongodb.net/?retryWrites=true&w=majority"

# mongo = MongoClient(uri, tlsCAFile=certifi.where())

app.config['MONGO_DBNAME'] = 'AttendanceSystem'
app.config['MONGO_URI'] = 'mongodb://localhost:27017/AttendanceSystem'
mongo = PyMongo(app)
# try:
#     client.admin.command('ping')
#     print("Pinged your deployment. You successfully connected to MongoDB!")
# except Exception as e:
#     print(e)
# app.config['MONGO_DBNAME'] = 'AttendanceSystem'
# app.config['MONGO_URI'] = "mongodb+srv://nigun:XhwoAqBIHyFJNdL5@cluster0.o3xkdml.mongodb.net/?retryWrites=true&w=majority"

# client = MongoClient(
#     "mongodb+srv://nigun:XhwoAqBIHyFJNdL5@cluster0.o3xkdml.mongodb.net/?retryWrites=true&w=majority")


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
        student['Date'] = {}
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


@app.route('/editmentor', methods=['POST'])
def edit_mentor():
    user = request.json
    year = user['year']
    section = user['section']
    collection_name = f"{year}_{section}"
    students_collection = mongo.db[collection_name]
    first_record = students_collection.find_one()

    # Get the values of 'mentor1', 'mentor2', and 'mentor3' as an array
    mentors = [first_record['mentor1'], first_record['mentor2']]
    if 'mentor3' in first_record:
        mentors.append(first_record['mentor3'])
    print(mentors)
    return jsonify({'data': mentors}), 200


@app.route('/updateMentor', methods=['POST'])
def update_mentor():
    user = request.json
    year = user['year']
    section = user['section']
    mentor1 = user['mentor1']
    mentor2 = user['mentor2']
    mentor3 = user['mentor3']

    collection_name = f"{year}_{section}"
    students_collection = mongo.db[collection_name]
    records = students_collection.find()

# Update each record with mentor values
    for record in records:
        record['mentor1'] = mentor1
        record['mentor2'] = mentor2
        record['mentor3'] = mentor3
        students_collection.update_one(
            {'_id': record['_id']}, {'$set': record})
    return jsonify({'message': 'success'}), 200


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
    # print(collection_name)
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
    current_date = datetime.now().strftime("%b %d, %Y")
    student_data['Date'] = {current_date: [0] * 7}
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
    # print(collection_name)
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
    # print(user)
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
    # print(collections)

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


@app.route('/getStudentData', methods=['POST'])
def get_student_data():
    user = request.json
    email = user['email']
    collections = mongo.db.list_collection_names()
    print(collections)

    for collection in collections:
        document = mongo.db[collection]
        result = document.find_one({"Official Mail ID (College)": email})
        if (result):
            year = result.get("year")
            section = result.get("section")
            print(year, section)
            return jsonify({"year": year, "section": section, "message": "Got"}), 200
    else:
        return jsonify({'message': 'no'}), 200


@app.route('/getattendance', methods=['POST'])
def get_attendance():

    user = request.json
    year = user['year']
    section = user['section']
    date = user['date']
    if (date == ""):
        return jsonify({"message": "nodate"}), 200

    collection_name = f"{year}_{section}"
    collection = mongo.db[collection_name]
    attendance_records = collection.find(
        {}, {'Name of the Student': 1, 'Register Number': 1, 'Date': 1})
    data = []
    for record in attendance_records:
        name = record['Name of the Student']
        reg_no = record['Register Number']
        date_dict = record.get('Date', {})
        if date not in date_dict:
            date_dict[date] = [0] * 7
            collection.update_one({'Register Number': record['Register Number']}, {
                                  '$set': {'Date': date_dict}})
        attendance = date_dict.get(date)
        data.append({
            'name': name,
            'reg_no': reg_no,
            'attendance': attendance,

        })
        sorted_date = record.get('Date', {})
        print(sorted_date)
        sorted_keys = sorted(sorted_date.keys(),
                             key=lambda x: datetime.strptime(x, '%b %d, %Y'))
        sorted_dict = {}
        for key in sorted_keys:
            sorted_dict[key] = date_dict[key]
        # print(sorted_dict)
        collection.update_one({'Register Number': record['Register Number']}, {
            '$set': {'Date': sorted_dict}})
    total_students = 0
    forenoon_present = 0
    forenoon_absent = 0
    forenoon_onduty = 0
    afternoon_onduty = 0
    afternoon_present = 0
    afternoon_absent = 0
    atten_det = []
    for record in collection.find():
        total_students += 1
        date_dict = record['Date']
        arr = date_dict[date]
        if all(x == 1 for x in arr[:4]):
            forenoon_present += 1
        else:
            forenoon_absent += 1

        if all(x == 1 for x in arr[4:]):
            afternoon_present += 1
        else:
            afternoon_absent += 1
        if all(x == 0.5 for x in arr[:4]):
            forenoon_onduty += 1
            forenoon_absent -= 1
        if all(x == 0.5 for x in arr[4:]):
            afternoon_onduty += 1
            afternoon_absent -= 1
    atten_det.append({
        'total': total_students,
        'fnp': forenoon_present,
        'fna': forenoon_absent,
        'anp': afternoon_present,
        'ana': afternoon_absent,
        'fond': forenoon_onduty,
        'aond': afternoon_onduty,


    })
    # print(atten_det)
    return jsonify({"data": data, "atten_det": atten_det}), 200


@app.route('/recordattendance', methods=['POST'])
def record_attendance():
    user = request.json
    year = user['year']
    section = user['section']
    date = user['date']
    ncollection = mongo.db["AdminAttendance"]
    collection_name = f"{year}_{section}"
    collection = mongo.db[collection_name]
    attendance_records = collection.find(
        {}, {'Name of the Student': 1, 'Register Number': 1, 'Date': 1})
    data = []
    for record in attendance_records:
        name = record['Name of the Student']
        reg_no = record['Register Number']
        date_dict = record.get('Date', {})
        if date not in date_dict:
            date_dict[date] = [0] * 7
            collection.update_one({'Register Number': record['Register Number']}, {
                                  '$set': {'Date': date_dict}})
        attendance = date_dict.get(date)
        data.append({
            'name': name,
            'reg_no': reg_no,
            'attendance': attendance,

        })
        sorted_date = record.get('Date', {})
        # print(sorted_date)
        sorted_keys = sorted(sorted_date.keys(),
                             key=lambda x: datetime.strptime(x, '%b %d, %Y'))
        sorted_dict = {}
        for key in sorted_keys:
            sorted_dict[key] = date_dict[key]
        # print(sorted_dict)
        collection.update_one({'Register Number': record['Register Number']}, {
            '$set': {'Date': sorted_dict}})
    total_students = 0
    forenoon_present = 0
    forenoon_absent = 0
    forenoon_onduty = 0
    afternoon_onduty = 0
    afternoon_present = 0
    afternoon_absent = 0
    atten_det = []
    for record in collection.find():
        total_students += 1
        date_dict = record['Date']
        arr = date_dict[date]
        if all(x == 1 for x in arr[:4]):
            forenoon_present += 1
        else:
            forenoon_absent += 1

        if all(x == 1 for x in arr[4:]):
            afternoon_present += 1
        else:
            afternoon_absent += 1
        if all(x == 0.5 for x in arr[:4]):
            forenoon_onduty += 1
            forenoon_absent -= 1
        if all(x == 0.5 for x in arr[4:]):
            afternoon_onduty += 1
            afternoon_absent -= 1
    atten_det.append({
        'total': total_students,
        'fnp': forenoon_present,
        'fna': forenoon_absent,
        'anp': afternoon_present,
        'ana': afternoon_absent,
        'fond': forenoon_onduty,
        'aond': afternoon_onduty,
    })
    existing_record = ncollection.find_one({"Date": date})
    if existing_record:
        newf_data = []
        newa_data = []
        newf_data.append(atten_det[0]['total'])
        newf_data.append(atten_det[0]['fnp'])
        newf_data.append(atten_det[0]['fna'])
        newf_data.append(atten_det[0]['fond'])
        newa_data.append(atten_det[0]['total'])
        newa_data.append(atten_det[0]['anp'])
        newa_data.append(atten_det[0]['ana'])
        newa_data.append(atten_det[0]['aond'])
        existing_record[collection_name] = [newf_data, newa_data]
        ncollection.update_one({"Date": date}, {"$set": existing_record})
        return jsonify({'message': 'success'}), 200
    else:
        record = {
            "Date": date,
            "I_A": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "I_B": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "I_C": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "I_D": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "II_A": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "II_B": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "II_C": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "II_D": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "III_A": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "III_B": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "III_C": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "III_D": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "IV_A": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "IV_B": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "IV_C": [[0, 0, 0, 0], [0, 0, 0, 0]],
            "IV_D": [[0, 0, 0, 0], [0, 0, 0, 0]],
        }
        ncollection.insert_one(record)
        existing_record = ncollection.find_one({"Date": date})
        newf_data = []
        newa_data = []
        newf_data.append(atten_det[0]['total'])
        newf_data.append(atten_det[0]['fnp'])
        newf_data.append(atten_det[0]['fna'])
        newf_data.append(atten_det[0]['fond'])
        newa_data.append(atten_det[0]['total'])
        newa_data.append(atten_det[0]['anp'])
        newa_data.append(atten_det[0]['ana'])
        newa_data.append(atten_det[0]['aond'])
        existing_record[collection_name] = [newf_data, newa_data]
        ncollection.update_one({"Date": date}, {"$set": existing_record})
        return jsonify({'message': 'success'}), 200


@app.route('/getfattendance', methods=['POST'])
def get_f_attendance():
    user = request.json
    date = user['date']
    collection = mongo.db["AdminAttendance"]
    records = collection.find({'Date': date})
    response_data = {}
# Get the current time
    current_date = datetime.now().date()
    current_time = datetime.now().time()

    # Create a datetime object for the target time (2 PM) on the current date
    target_time = datetime.combine(current_date, time(14, 0))
    for record in records:
        for section, values in record.items():
            if section != "_id" and section != "Date" and isinstance(values, list) and len(values) > 0:
                first_value = values[0][0]
                last_value = values[1][0]
                if current_time < target_time.time():
                    if first_value == 0:
                        response_data[section] = {
                            'forenoon': {
                                'total': "Not Recorded",
                                'present': "Not Recorded",
                                'absent': "Not Recorded",
                                'on-duty': "Not Recorded"
                            },
                            'afternoon': {
                                'total': "Not Recorded",
                                'present': "Not Recorded",
                                'absent': "Not Recorded",
                                'on-duty': "Not Recorded"
                            }
                        }

                    else:
                        forenoon_values = values[0]

                        response_data[section] = {
                            'forenoon': {
                                'total': forenoon_values[0],
                                'present': forenoon_values[1],
                                'absent': forenoon_values[2],
                                'on-duty': forenoon_values[3]
                            },
                            'afternoon': {
                                'total': "Not Recorded",
                                'present': "Not Recorded",
                                'absent': "Not Recorded",
                                'on-duty': "Not Recorded"
                            }
                        }
                else:
                    forenoon_values = values[0]  # First array (forenoon)
                    afternoon_values = values[1]

                    if first_value == 0 and last_value == 0:
                        response_data[section] = {
                            'forenoon': {
                                'total': "Not Recorded",
                                'present': "Not Recorded",
                                'absent': "Not Recorded",
                                'on-duty': "Not Recorded"
                            },
                            'afternoon': {
                                'total': "Not Recorded",
                                'present': "Not Recorded",
                                'absent': "Not Recorded",
                                'on-duty': "Not Recorded"
                            }
                        }
                    elif first_value == 0:
                        response_data[section] = {
                            'forenoon': {
                                'total': "Not Recorded",
                                'present': "Not Recorded",
                                'absent': "Not Recorded",
                                'on-duty': "Not Recorded"
                            },
                            'afternoon': {
                                'total': afternoon_values[0],
                                'present': afternoon_values[1],
                                'absent': afternoon_values[2],
                                'on-duty': afternoon_values[3]
                            }
                        }

                    elif last_value == 0:
                        response_data[section] = {
                            'forenoon': {
                                'total': forenoon_values[0],
                                'present': forenoon_values[1],
                                'absent': forenoon_values[2],
                                'on-duty': forenoon_values[3]
                            },
                            'afternoon': {
                                'total': "Not Recorded",
                                'present': "Not Recorded",
                                'absent': "Not Recorded",
                                'on-duty': "Not Recorded"
                            }
                        }

                    else:
                        response_data[section] = {
                            'forenoon': {
                                'total': forenoon_values[0],
                                'present': forenoon_values[1],
                                'absent': forenoon_values[2],
                                'on-duty': forenoon_values[3]
                            },
                            'afternoon': {
                                'total': afternoon_values[0],
                                'present': afternoon_values[1],
                                'absent': afternoon_values[2],
                                'on-duty': afternoon_values[3]
                            }
                        }
    print(response_data)
    if (len(response_data) == 0):
        return jsonify({"message": "nope"}), 200

    return jsonify({"data": response_data}), 200


@app.route('/updateattendance', methods=['POST'])
def update_attendance():
    user = request.json
    year = user['year']
    section = user['section']
    regno = user['regno']
    date = user['date']
    attendance = user['attendance']
    collection_name = f"{year}_{section}"
    students_collection = mongo.db[collection_name]
    students_collection.update_one(
        {'Register Number': regno}, {'$set': {f"Date.{date}": attendance}})
    atten_det = []
    total_students = 0
    forenoon_present = 0
    forenoon_absent = 0
    forenoon_onduty = 0
    afternoon_onduty = 0
    afternoon_present = 0
    afternoon_absent = 0
    for record in students_collection.find():
        total_students += 1
        date_dict = record['Date']
        arr = date_dict[date]
        if all(x == 1 for x in arr[:4]):
            forenoon_present += 1
        else:
            forenoon_absent += 1

        if all(x == 1 for x in arr[4:]):
            afternoon_present += 1

        else:
            afternoon_absent += 1
        if all(x == 0.5 for x in arr[:4]):
            forenoon_onduty += 1
            forenoon_absent -= 1
        if all(x == 0.5 for x in arr[4:]):
            afternoon_onduty += 1
            afternoon_absent -= 1
    atten_det.append({
        'total': total_students,
        'fnp': forenoon_present,
        'fna': forenoon_absent,
        'anp': afternoon_present,
        'ana': afternoon_absent,
        'fond': forenoon_onduty,
        'aond': afternoon_onduty

    })
    return jsonify({'atten_det': atten_det}), 200


@app.route('/getmonthattendance', methods=['POST'])
def get_month_attendance():
    user = request.json
    year = user['year']
    section = user['section']
    start_month_str = user["startmonth"]
    end_month_str = user["endmonth"]
    # print(start_month_str)
    # print(end_month_str)
    collection_name = f"{year}_{section}"
    students_collection = mongo.db[collection_name]
    start_month = datetime.strptime(start_month_str, '%b %Y')

    end_month = datetime.strptime(end_month_str, '%b %Y')
    start_month_str = datetime.strftime(start_month, '%b %Y')
    end_month_str = datetime.strftime(end_month, '%b %Y')
    # print(start_month_str)
    # print(end_month_str)
    month_attendance = []
    student_collection = students_collection.find()
    total_days = 0
    for student in student_collection:
        total_present = 0
        total_onduty = 0
        total_absent = 0
        working_days = {

        }
        # Extract the month and year from the first date in the record
        first_date = datetime.strptime(
            list(student['Date'].keys())[0], '%b %d, %Y')
        first_month_year = datetime.strftime(first_date, '%b %Y')
        # print(first_month_year)

    # Extract the month and year from the last date in the record
        last_date = datetime.strptime(
            list(student['Date'].keys())[-1], '%b %d, %Y')
        last_month_year = datetime.strftime(last_date, '%b %Y')
        # print(last_month_year)
        start_month_date = datetime.strptime(start_month_str, '%b %Y')
        first_month_date = datetime.strptime(first_month_year, '%b %Y')
        end_month_date = datetime.strptime(end_month_str, '%b %Y')
        last_month_date = datetime.strptime(last_month_year, '%b %Y')

    # Check if start_month and end_month fall within the same month and year in the record
        if start_month_date < first_month_date or start_month_date > last_month_date or start_month_date > end_month_date:
            # print("syes")
            return jsonify({"message":          "nomonth"}), 200
        if end_month_date > last_month_date or end_month_date < first_month_date or end_month_date < start_month_date:
            # print("eyes")
            return jsonify({"message":          "nomonth"}), 200
        else:

            student_attendance = {
                'name': student['Name of the Student'], 'RegisterNumber': student['Register Number']}

            for dt in rrule(MONTHLY, dtstart=start_month, until=end_month):
                m_p = 0
                m_a = 0
                m_o = 0
                month_year = dt.strftime('%b %Y')
                attendance_info = {
                    'forenoon': {
                        'present': 0,
                        'absent': 0,
                        'onduty': 0
                    },
                    'afternoon': {
                        'present': 0,
                        'absent': 0,
                        'onduty': 0
                    }
                }

                current_month = 0
                for date_key, attendance_list in student['Date'].items():
                    date = datetime.strptime(date_key, '%b %d, %Y')

                    if date.month == dt.month and date.year == dt.year:
                        current_month += 1
                        for i, attendance in enumerate(attendance_list):
                            if i < 4:
                                if attendance == 1:
                                    total_present += 1
                                    m_p += 1
                                    attendance_info['forenoon']['present'] += 1
                                elif attendance == 0:
                                    m_a += 1
                                    attendance_info['forenoon']['absent'] += 1
                                    total_absent += 1
                                elif attendance == 0.5:
                                    m_o += 1
                                    total_onduty += 1
                                    attendance_info['forenoon']['onduty'] += 1
                            else:
                                if attendance == 1:
                                    m_p += 1
                                    total_present += 1
                                    attendance_info['afternoon']['present'] += 1
                                elif attendance == 0:
                                    m_a += 1
                                    total_absent += 1
                                    attendance_info['afternoon']['absent'] += 1
                                elif attendance == 0.5:
                                    m_o += 1
                                    total_onduty += 1
                                    attendance_info['afternoon']['onduty'] += 1
                student_attendance[month_year] = attendance_info
                # student_attendance["Present(" + month_year + ")"] = m_p
                # student_attendance["Absent(" + month_year + ")"] = m_a
                # student_attendance["On-Duty(" + month_year + ")"] = m_o
                working_days[month_year] = current_month

        total_days = ((total_present+total_absent+total_onduty)//7)
        percentage = round((total_present/(total_days*7))*100, 2)

        student_attendance['working_days'] = working_days
        student_attendance['total_present'] = total_present
        student_attendance['total_absent'] = total_absent
        student_attendance['total_onduty'] = total_onduty
        student_attendance['percentage'] = percentage
        print(student_attendance)
        month_attendance.append(student_attendance)

    # print(month_attendance)
    return jsonify({'message': "yes", "data": month_attendance}), 200


@app.route('/getSmonthattendance', methods=['POST'])
def get_Smonth_attendance():
    user = request.json
    year = user['year']
    mail = user['mail']
    section = user['section']
    start_month_str = user["startmonth"]
    end_month_str = user["endmonth"]
    # print(start_month_str)
    # print(end_month_str)
    collection_name = f"{year}_{section}"
    students_collection = mongo.db[collection_name]
    start_month = datetime.strptime(start_month_str, '%b %Y')

    end_month = datetime.strptime(end_month_str, '%b %Y')
    start_month_str = datetime.strftime(start_month, '%b %Y')
    end_month_str = datetime.strftime(end_month, '%b %Y')
    # print(start_month_str)
    # print(end_month_str)
    month_attendance = []
    student_collection = students_collection.find()
    total_days = 0
    for student in student_collection:
        if student['Official Mail ID (College)'] == mail:
            total_present = 0
            total_onduty = 0
            total_absent = 0
            working_days = {

            }
            # Extract the month and year from the first date in the record
            first_date = datetime.strptime(
                list(student['Date'].keys())[0], '%b %d, %Y')
            first_month_year = datetime.strftime(first_date, '%b %Y')
            # print(first_month_year)

        # Extract the month and year from the last date in the record
            last_date = datetime.strptime(
                list(student['Date'].keys())[-1], '%b %d, %Y')
            last_month_year = datetime.strftime(last_date, '%b %Y')
            # print(last_month_year)
            start_month_date = datetime.strptime(start_month_str, '%b %Y')
            first_month_date = datetime.strptime(first_month_year, '%b %Y')
            end_month_date = datetime.strptime(end_month_str, '%b %Y')
            last_month_date = datetime.strptime(last_month_year, '%b %Y')

        # Check if start_month and end_month fall within the same month and year in the record
            if start_month_date < first_month_date or start_month_date > last_month_date or start_month_date > end_month_date:
                # print("syes")
                return jsonify({"message":          "nomonth"}), 200
            if end_month_date > last_month_date or end_month_date < first_month_date or end_month_date < start_month_date:
                # print("eyes")
                return jsonify({"message":          "nomonth"}), 200
            else:

                student_attendance = {
                    'name': student['Name of the Student'], 'RegisterNumber': student['Register Number']}

                for dt in rrule(MONTHLY, dtstart=start_month, until=end_month):
                    m_p = 0
                    m_a = 0
                    m_o = 0
                    month_year = dt.strftime('%b %Y')
                    attendance_info = {
                        'forenoon': {
                            'present': 0,
                            'absent': 0,
                            'onduty': 0
                        },
                        'afternoon': {
                            'present': 0,
                            'absent': 0,
                            'onduty': 0
                        }
                    }

                    current_month = 0
                    for date_key, attendance_list in student['Date'].items():
                        date = datetime.strptime(date_key, '%b %d, %Y')

                        if date.month == dt.month and date.year == dt.year:
                            current_month += 1
                            for i, attendance in enumerate(attendance_list):
                                if i < 4:
                                    if attendance == 1:
                                        total_present += 1
                                        m_p += 1
                                        attendance_info['forenoon']['present'] += 1
                                    elif attendance == 0:
                                        m_a += 1
                                        attendance_info['forenoon']['absent'] += 1
                                        total_absent += 1
                                    elif attendance == 0.5:
                                        m_o += 1
                                        total_onduty += 1
                                        attendance_info['forenoon']['onduty'] += 1
                                else:
                                    if attendance == 1:
                                        m_p += 1
                                        total_present += 1
                                        attendance_info['afternoon']['present'] += 1
                                    elif attendance == 0:
                                        m_a += 1
                                        total_absent += 1
                                        attendance_info['afternoon']['absent'] += 1
                                    elif attendance == 0.5:
                                        m_o += 1
                                        total_onduty += 1
                                        attendance_info['afternoon']['onduty'] += 1
                    student_attendance[month_year] = attendance_info
                    # student_attendance["Present(" + month_year + ")"] = m_p
                    # student_attendance["Absent(" + month_year + ")"] = m_a
                    # student_attendance["On-Duty(" + month_year + ")"] = m_o
                    working_days[month_year] = current_month

            total_days = ((total_present+total_absent+total_onduty)//7)
            percentage = round((total_present/(total_days*7))*100, 2)

            student_attendance['working_days'] = working_days
            student_attendance['total_present'] = total_present
            student_attendance['total_absent'] = total_absent
            student_attendance['total_onduty'] = total_onduty
            student_attendance['percentage'] = percentage
            print(student_attendance)
            month_attendance.append(student_attendance)
            break
        else:
            continue

    # print(month_attendance)
    return jsonify({'message': "yes", "data": month_attendance}), 200


@app.route('/getdateattendance', methods=['POST'])
def get_date_attendance():
    user = request.json
    year = user['year']
    section = user['section']
    start_date_str = user["startdate"]
    end_date_str = user["enddate"]

    # print(start_month_str)
    # print(end_month_str)
    collection_name = f"{year}_{section}"
    students_collection = mongo.db[collection_name]
    start_date = datetime.strptime(start_date_str, '%d %b %Y')
    end_date = datetime.strptime(end_date_str, '%d %b %Y')
    start_date_str = datetime.strftime(start_date, '%d %b %Y')
    end_date_str = datetime.strftime(end_date, '%d %b %Y')
    # print(start_month_str)
    # print(end_month_str)
    date_attendance = []
    student_collection = students_collection.find()
    total_days = 0
    for student in student_collection:
        total_present = 0
        total_onduty = 0
        total_absent = 0
        # Extract the month and year from the first date in the record
        start_date = datetime.strptime(start_date_str, '%d %b %Y')
        end_date = datetime.strptime(end_date_str, '%d %b %Y')

# Extract the month and year from the first date in the record
        first_date = datetime.strptime(
            list(student['Date'].keys())[0], '%b %d, %Y')
        first_month_year = datetime.strftime(first_date, '%b %Y')

# Extract the month and year from the last date in the record
        last_date = datetime.strptime(
            list(student['Date'].keys())[-1], '%b %d, %Y')
        last_month_year = datetime.strftime(last_date, '%b %Y')
        if start_date < first_date or end_date > last_date or start_date > last_date or end_date < first_date:
            if (end_date > last_date):
                end_date = last_date
            print("yes")
            return jsonify({"message": "nomonth"}), 200

        else:

            student_attendance = {
                'name': student['Name of the Student'], 'RegisterNumber': student['Register Number']}
            attendance_info = {
            }
            for dt in rrule(DAILY, dtstart=start_date, until=end_date):
                date_str = dt.strftime('%b %d, %Y')
                attendance = student['Date'].get(date_str)
                if attendance:
                    forenoon_attendance = attendance[:4]
                    afternoon_attendance = attendance[4:]
                    f_p_c = forenoon_attendance.count(1)
                    f_a_c = forenoon_attendance.count(0)
                    f_o_c = forenoon_attendance.count(0.5)
                    a_p_c = afternoon_attendance.count(1)
                    a_a_c = afternoon_attendance.count(0)
                    a_o_c = afternoon_attendance.count(0.5)
                    if f_p_c == 4:
                        attendance_info['forenoon'] = "Present"
                    elif f_a_c == 4:
                        attendance_info['forenoon'] = "Absent"
                    elif f_o_c == 4:
                        attendance_info['forenoon'] = "On-Duty"
                    if a_p_c == 3:
                        attendance_info['afternoon'] = "Present"
                    elif a_a_c == 3:
                        attendance_info['afternoon'] = "Absent"
                    elif a_o_c == 3:
                        attendance_info['afternoon'] = "On-Duty"
                    student_attendance[date_str] = attendance_info
            date_attendance.append(student_attendance)
    print(date_attendance)
    return jsonify({'message': "yes", "data": date_attendance
                    }), 200


@app.route('/getSdateattendance', methods=['POST'])
def get_Sdate_attendance():
    user = request.json
    mail = user['mail']
    year = user['year']
    section = user['section']
    start_date_str = user["startdate"]
    end_date_str = user["enddate"]

    # print(start_month_str)
    # print(end_month_str)
    collection_name = f"{year}_{section}"
    students_collection = mongo.db[collection_name]
    start_date = datetime.strptime(start_date_str, '%d %b %Y')
    end_date = datetime.strptime(end_date_str, '%d %b %Y')
    start_date_str = datetime.strftime(start_date, '%d %b %Y')
    end_date_str = datetime.strftime(end_date, '%d %b %Y')
    # print(start_month_str)
    # print(end_month_str)
    date_attendance = []
    student_collection = students_collection.find()
    total_days = 0
    for student in student_collection:
        if student['Official Mail ID (College)'] == mail:
            # Extract the month and year from the first date in the record
            start_date = datetime.strptime(start_date_str, '%d %b %Y')
            end_date = datetime.strptime(end_date_str, '%d %b %Y')

    # Extract the month and year from the first date in the record
            first_date = datetime.strptime(
                list(student['Date'].keys())[0], '%b %d, %Y')
            first_month_year = datetime.strftime(first_date, '%b %Y')

    # Extract the month and year from the last date in the record
            last_date = datetime.strptime(
                list(student['Date'].keys())[-1], '%b %d, %Y')
            last_month_year = datetime.strftime(last_date, '%b %Y')
            if start_date < first_date or end_date > last_date or start_date > last_date or end_date < first_date:
                if (end_date > last_date):
                    end_date = last_date
                print("yes")
                return jsonify({"message": "nomonth"}), 200

            else:
                student_attendance = {
                    'name': student['Name of the Student'], 'RegisterNumber': student['Register Number']}
                attendance_info = {
                }
                for dt in rrule(DAILY, dtstart=start_date, until=end_date):
                    date_str = dt.strftime('%b %d, %Y')
                    attendance = student['Date'].get(date_str)
                    if attendance:
                        forenoon_attendance = attendance[:4]
                        afternoon_attendance = attendance[4:]
                        f_p_c = forenoon_attendance.count(1)
                        f_a_c = forenoon_attendance.count(0)
                        f_o_c = forenoon_attendance.count(0.5)
                        a_p_c = afternoon_attendance.count(1)
                        a_a_c = afternoon_attendance.count(0)
                        a_o_c = afternoon_attendance.count(0.5)
                        if f_p_c == 4:
                            attendance_info['forenoon'] = "Present"
                        elif f_a_c == 4:
                            attendance_info['forenoon'] = "Absent"
                        elif f_o_c == 4:
                            attendance_info['forenoon'] = "On-Duty"
                        if a_p_c == 3:
                            attendance_info['afternoon'] = "Present"
                        elif a_a_c == 3:
                            attendance_info['afternoon'] = "Absent"
                        elif a_o_c == 3:
                            attendance_info['afternoon'] = "On-Duty"
                        student_attendance[date_str] = attendance_info
                date_attendance.append(student_attendance)
            break
        print(date_attendance)

    return jsonify({'message': "yes", "data": date_attendance
                    }), 200


if __name__ == '__main__':
    app.run(host="10.10.41.178")
