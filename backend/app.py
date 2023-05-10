import csv
import io
from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS, cross_origin
from flask_pymongo import PyMongo
from datetime import datetime
from dateutil.rrule import rrule, MONTHLY
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
    # print(atten_det)
    return jsonify({"data": data, "atten_det": atten_det}), 200


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
                                    attendance_info['forenoon']['present'] += 1
                                elif attendance == 0:
                                    attendance_info['forenoon']['absent'] += 1
                                    total_absent += 1
                                elif attendance == 0.5:
                                    total_onduty += 1
                                    attendance_info['forenoon']['onduty'] += 1
                            else:
                                if attendance == 1:
                                    total_present += 1
                                    attendance_info['afternoon']['present'] += 1
                                elif attendance == 0:
                                    total_absent += 1
                                    attendance_info['afternoon']['absent'] += 1
                                elif attendance == 0.5:
                                    total_onduty += 1
                                    attendance_info['afternoon']['onduty'] += 1
                student_attendance[month_year] = attendance_info
                working_days[month_year] = current_month

        total_days = ((total_present+total_absent+total_onduty)//7)
        percentage = round((total_present/(total_days*7))*100, 2)
        print(total_days)
        student_attendance['working_days'] = working_days
        student_attendance['total_present'] = total_present
        student_attendance['total_absent'] = total_absent
        student_attendance['total_onduty'] = total_onduty
        student_attendance['percentage'] = percentage
        print(student_attendance)
        month_attendance.append(student_attendance)

    # print(month_attendance)
    return jsonify({'message': "yes", "data": month_attendance}), 200


if __name__ == '__main__':
    app.run(debug=True)
